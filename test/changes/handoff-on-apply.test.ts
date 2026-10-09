import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runApply } from '../../src/changes/apply.js';
import { computeImpact, formatImpact } from '../../src/changes/impact.js';
import { runBaseline } from '../../src/commands/baseline.js';
import { runChangeSync } from '../../src/commands/change-sync.js';
import { runChangeEdit, runChangeNew, runChangeStatus } from '../../src/commands/change.js';
import { runHandoff } from '../../src/commands/handoff.js';
import { staleBundles } from '../../src/handoff/stale.js';
import { readSpecDir } from '../../src/spec/files.js';
import { copyFixture } from '../fixture.js';
import { edit, overlay, read } from './helpers.js';

const HR1 = 'modules/hr/capabilities/CAP-HR-001.md';
const HR2 = 'modules/hr/capabilities/CAP-HR-002.md';
const DATE = '2026-10-07';

interface Manifest {
  exported: string;
  sources: { id: string; version?: number; fingerprint: string }[];
}
const manifest = (dir: string, id: string): Manifest =>
  JSON.parse(readFileSync(join(dir, 'handoff/bundle', id, 'manifest.json'), 'utf8')) as Manifest;

function approved(dir: string, id: string) {
  runChangeStatus(dir, id, 'in_review');
  runChangeStatus(dir, id, 'approved');
}

describe('handoff on apply', () => {
  it('hands off a ready capability the change touched, and announces it in the impact', () => {
    const dir = copyFixture();
    runBaseline(dir);
    const { id } = runChangeNew(dir, 'Clearer title');
    runChangeEdit(dir, id, 'CAP-HR-001');
    edit(dir, overlay(id, HR1), 'title: Register employee', 'title: Register a new employee');
    const impact = computeImpact(dir, id);
    expect(impact.handoff).toEqual({ exports: ['CAP-HR-001'], blocked: [] });
    expect(formatImpact(impact)).toContain('will be exported: CAP-HR-001');
    approved(dir, id);
    const r = runApply(dir, id, { date: DATE });
    expect(r.handoff.exported).toEqual([{ id: 'CAP-HR-001', folder: 'handoff/bundle/CAP-HR-001' }]);
    expect(r.handoff.blocked).toEqual([]);
    const m = manifest(dir, 'CAP-HR-001');
    expect(m.exported).toBe(DATE);
    expect(m.sources.find((s) => s.id === 'CAP-HR-001')?.version).toBe(2);
    expect(staleBundles(dir, readSpecDir(join(dir, 'spec')))).toEqual([]);
  });

  it('does not hand off a draft capability, and says why', () => {
    const dir = copyFixture();
    runBaseline(dir);
    const { id } = runChangeNew(dir, 'Probation');
    runChangeEdit(dir, id, 'CAP-HR-002');
    edit(dir, overlay(id, HR2), 'title: Activate employee', 'title: Activate employee after probation');
    expect(computeImpact(dir, id).handoff.blocked).toEqual([
      { id: 'CAP-HR-002', reason: expect.stringMatching(/CAP-HR-002 is draft/) },
    ]);
    approved(dir, id);
    const r = runApply(dir, id, { date: DATE });
    expect(r.handoff.exported).toEqual([]);
    expect(r.handoff.blocked[0]?.reason).toMatch(/draft/);
    expect(existsSync(join(dir, 'handoff'))).toBe(false);
  });

  it('refreshes a bundle whose sources moved, even when the change did not touch the capability', () => {
    const dir = copyFixture();
    runHandoff(dir, 'CAP-HR-001', { date: '2026-10-01' });
    const before = manifest(dir, 'CAP-HR-001').sources.find((s) => s.id === 'ENT-EMPLOYEE')!.fingerprint;
    runBaseline(dir);
    const { id } = runChangeNew(dir, 'Intern contracts');
    runChangeEdit(dir, id, 'ENT-EMPLOYEE');
    edit(
      dir,
      overlay(id, 'application/entities/ENT-EMPLOYEE.md'),
      'options: [Permanent, Fixed term]',
      'options: [Permanent, Fixed term, Intern]',
    );
    runChangeSync(dir, id);
    // the experience of SCR-HR-01 was re-aligned but not re-reviewed: the bundle is stale and blocked
    const impact = computeImpact(dir, id);
    expect(impact.handoff.exports).toEqual([]);
    expect(impact.handoff.blocked[0]).toMatchObject({ id: 'CAP-HR-001' });
    expect(impact.handoff.blocked[0]?.reason).toMatch(/experience/);
    approved(dir, id);
    const r = runApply(dir, id, { date: DATE });
    expect(r.handoff.blocked[0]?.reason).toMatch(/experience/);
    expect(manifest(dir, 'CAP-HR-001').exported).toBe('2026-10-01');
    expect(staleBundles(dir, readSpecDir(join(dir, 'spec'))).map((b) => b.id)).toEqual(['CAP-HR-001']);
    expect(manifest(dir, 'CAP-HR-001').sources.find((s) => s.id === 'ENT-EMPLOYEE')!.fingerprint).toBe(
      before,
    );
  });

  it('refreshes a stale bundle that still passes the gate', () => {
    const dir = copyFixture();
    runHandoff(dir, 'CAP-HR-001', { date: '2026-10-01' });
    runBaseline(dir);
    const { id } = runChangeNew(dir, 'Rule wording');
    runChangeEdit(dir, id, 'RULE-001');
    edit(dir, overlay(id, 'application/rules.md'), 'A payslip may only', 'A payslip may only ever');
    const touched = computeImpact(dir, id).modified.map((m) => m.key);
    expect(touched).toEqual(['RULE-001']);
    const bundleUsesRule = manifest(dir, 'CAP-HR-001').sources.some((s) => s.id === 'RULE-001');
    approved(dir, id);
    const r = runApply(dir, id, { date: DATE });
    if (bundleUsesRule) {
      expect(r.handoff.exported.map((h) => h.id)).toEqual(['CAP-HR-001']);
      expect(manifest(dir, 'CAP-HR-001').exported).toBe(DATE);
    } else {
      expect(r.handoff.exported).toEqual([]);
    }
    expect(staleBundles(dir, readSpecDir(join(dir, 'spec')))).toEqual([]);
    expect(read(dir, `spec/changes/archive/${id}/proposal.md`)).toContain('status: applied');
  });
});
