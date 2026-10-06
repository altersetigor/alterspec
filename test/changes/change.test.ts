import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { runApply } from '../../src/changes/apply.js';
import { runBaseline } from '../../src/commands/baseline.js';
import { runChangeEdit, runChangeNew, runChangeRemove, runChangeStatus } from '../../src/commands/change.js';
import { runNew } from '../../src/commands/new.js';
import { runValidate } from '../../src/commands/validate.js';
import { splitFrontMatter } from '../../src/lib/frontmatter.js';
import { copyFixture } from '../fixture.js';
import { HR2, edit, overlay, projectWithChange, read } from './helpers.js';

const proposal = (dir: string, id: string) =>
  parse(splitFrontMatter(read(dir, `spec/changes/${id}/proposal.md`)).raw ?? '') as Record<
    string,
    unknown
  > & { base: Record<string, string | null>; removes: string[] };

describe('baseline', () => {
  it('refuses a second baseline without --force, and a spec with errors', () => {
    const dir = copyFixture();
    expect(runBaseline(dir).objects).toBeGreaterThan(20);
    expect(() => runBaseline(dir)).toThrow(/already exists/);
    expect(runBaseline(dir, { force: true }).objects).toBeGreaterThan(20);
    const broken = copyFixture();
    edit(broken, `spec/${HR2}`, 'rules: []', 'rules: [RULE-999]');
    expect(() => runBaseline(broken)).toThrow(/lint error/);
  });

  it('direct edits after the baseline are errors', () => {
    const dir = copyFixture();
    runBaseline(dir);
    expect(runValidate(dir).findings).toEqual([]);
    runNew(dir, 'decision', { title: 'Direct' });
    expect(runValidate(dir).findings.map((f) => f.rule)).toContain('direct-edit');
  });
});

describe('change new / edit / remove', () => {
  it('creates a proposal and copies objects with their base fingerprint', () => {
    const { dir, id } = projectWithChange();
    expect(id).toBe('CHG-001');
    expect(read(dir, overlay(id, HR2))).toContain('after probation');
    expect(proposal(dir, id).base['CAP-HR-002']).toMatch(/^[0-9a-f]{16}$/);
    // the main spec and its lint are untouched
    expect(read(dir, `spec/${HR2}`)).toContain('title: Activate employee\n');
    expect(runValidate(dir).findings).toEqual([]);
    // copying again is a no-op
    expect(runChangeEdit(dir, id, 'cap-hr-002').copied).toBe(false);
  });

  it('copies single collection items, not whole files', () => {
    const { dir, id } = projectWithChange();
    runChangeEdit(dir, id, 'ROLE-ACCOUNTANT');
    runChangeEdit(dir, id, 'term:Payslip');
    const roles = read(dir, overlay(id, 'application/personas-roles.md'));
    expect(roles).toMatch(/^## ROLE-ACCOUNTANT/);
    expect(roles).not.toContain('PER-');
    expect(read(dir, overlay(id, 'application/glossary.md'))).toMatch(/^## Payslip/);
  });

  it('new --change creates inside the overlay and touches APP through the change', () => {
    const { dir, id } = projectWithChange();
    const mod = runNew(dir, 'module', { code: 'INV', title: 'Invoicing', change: id });
    expect(mod.file).toBe(`spec/changes/${id}/spec/modules/inv/module.md`);
    expect(existsSync(join(dir, 'spec/modules/inv'))).toBe(false);
    expect(read(dir, overlay(id, 'application/application.md'))).toContain('- MOD-INV');
    expect(read(dir, 'spec/application/application.md')).not.toContain('MOD-INV');
    const cap = runNew(dir, 'capability', {
      module: 'INV',
      title: 'Issue invoice',
      role: 'ACCOUNTANT',
      change: id,
    });
    expect(cap.id).toBe('CAP-INV-001');
    runNew(dir, 'flow', { title: 'Invoice', capability: 'CAP-INV-001', change: id });
    expect(read(dir, overlay(id, 'modules/inv/capabilities/CAP-INV-001.md'))).toMatch(
      /flows:\n {2}- FLOW-003/,
    );
    runNew(dir, 'role', { name: 'billing', title: 'Billing', change: id });
    runNew(dir, 'term', { term: 'Invoice', change: id });
    const base = proposal(dir, id).base;
    expect(base).toMatchObject({
      'MOD-INV': null,
      'CAP-INV-001': null,
      'FLOW-003': null,
      'ROLE-BILLING': null,
      'term:Invoice': null,
    });
    expect(base.APP).toMatch(/^[0-9a-f]{16}$/);
    expect(runValidate(dir, { change: id }).findings.filter((f) => f.severity === 'error')).toEqual([]);
  });

  it('parallel changes never get the same ID', () => {
    const dir = copyFixture();
    const a = runChangeNew(dir, 'A').id;
    const b = runChangeNew(dir, 'B').id;
    expect([a, b]).toEqual(['CHG-001', 'CHG-002']);
    expect(runNew(dir, 'capability', { module: 'HR', title: 'X', role: 'HR-MANAGER', change: a }).id).toBe(
      'CAP-HR-004',
    );
    expect(runNew(dir, 'capability', { module: 'HR', title: 'Y', role: 'HR-MANAGER', change: b }).id).toBe(
      'CAP-HR-005',
    );
  });

  it('remove records the base and the removal; validate --change sees dangling references', () => {
    const { dir, id } = projectWithChange();
    runChangeRemove(dir, id, 'CAP-HR-003');
    expect(proposal(dir, id).removes).toEqual(['CAP-HR-003']);
    const errors = runValidate(dir, { change: id }).findings.filter((f) => f.severity === 'error');
    expect(errors.map((f) => `${f.rule} ${f.file}`)).toEqual(
      expect.arrayContaining([
        'unknown-reference modules/hr/screens/SCR-HR-01.md',
        'unknown-reference application/flows/FLOW-002.md',
      ]),
    );
    expect(() => runChangeEdit(dir, id, 'CAP-HR-003')).toThrow(/removed by/);
  });

  it('refuses unknown objects and changes', () => {
    const { dir, id } = projectWithChange();
    expect(() => runChangeEdit(dir, id, 'CAP-HR-099')).toThrow(/doesn't exist in the spec/);
    expect(() => runChangeEdit(dir, 'CHG-009', 'CAP-HR-001')).toThrow(/doesn't exist/);
    expect(() => runChangeNew(dir, ' ')).toThrow(/--title/);
  });
});

describe('status and conflicts', () => {
  it('draft → in_review → approved → apply; editing after approval blocks apply', () => {
    const { dir, id } = projectWithChange();
    expect(() => runChangeStatus(dir, id, 'approved')).toThrow(/can't go from draft to approved/);
    expect(() => runApply(dir, id)).toThrow(/only an approved change/);
    runChangeStatus(dir, id, 'in_review');
    runChangeStatus(dir, id, 'approved');
    expect(proposal(dir, id).approved_hash).toMatch(/^[0-9a-f]{16}$/);
    expect(() => runChangeEdit(dir, id, 'CAP-HR-001')).toThrow(/is approved/);
    edit(dir, overlay(id, HR2), 'after probation', 'after the probation period');
    expect(() => runApply(dir, id)).toThrow(/edited after it was approved/);
  });

  it('refuses review with errors, empty changes and unknown statuses', () => {
    const dir = copyFixture();
    const { id } = runChangeNew(dir, 'Empty');
    expect(() => runChangeStatus(dir, id, 'in_review')).toThrow(/doesn't change anything/);
    expect(() => runChangeStatus(dir, id, 'applied')).toThrow(/set by `alterspec apply`/);
    runChangeRemove(dir, id, 'CAP-HR-003');
    expect(() => runChangeStatus(dir, id, 'in_review')).toThrow(/lint error/);
    expect(runChangeStatus(dir, id, 'rejected').status).toBe('rejected');
    expect(() => runChangeStatus(dir, id, 'draft')).toThrow(/can't go from rejected/);
  });

  it('a direct edit or another applied change is a conflict', () => {
    const { dir, id } = projectWithChange();
    const other = runChangeNew(dir, 'Other').id;
    runChangeEdit(dir, other, 'CAP-HR-002');
    edit(dir, overlay(other, HR2), 'ops: [R, U]', 'ops: [R, U, D]');
    runChangeStatus(dir, other, 'in_review');
    runChangeStatus(dir, other, 'approved');
    runApply(dir, other);
    expect(() => runChangeStatus(dir, id, 'in_review')).toThrow(/conflicts: CAP-HR-002/);
    // rebase: accept the current spec as base after re-reading it
    runChangeEdit(dir, id, 'CAP-HR-002', { rebase: true });
    edit(dir, overlay(id, HR2), 'ops: [R, U]', 'ops: [R, U, D]');
    expect(runChangeStatus(dir, id, 'in_review').status).toBe('in_review');
  });

  it('a change folder in the archive is not open', () => {
    const dir = copyFixture();
    mkdirSync(join(dir, 'spec/changes/archive/CHG-001'), { recursive: true });
    writeFileSync(join(dir, 'spec/changes/archive/CHG-001/proposal.md'), 'x');
    expect(() => runChangeEdit(dir, 'CHG-001', 'APP')).toThrow(/already applied or archived/);
    expect(runChangeNew(dir, 'Next').id).toBe('CHG-002');
  });
});
