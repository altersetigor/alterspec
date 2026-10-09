import { runExperienceReviewed, runExperienceSync } from '../../src/commands/experience.js';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runApply } from '../../src/changes/apply.js';
import { readBaseline } from '../../src/changes/baseline.js';
import { computeImpact, formatImpact } from '../../src/changes/impact.js';
import { runChangeEdit, runChangeRemove, runChangeStatus } from '../../src/commands/change.js';
import { runNew } from '../../src/commands/new.js';
import { runValidate } from '../../src/commands/validate.js';
import { runViews } from '../../src/commands/views.js';
import { HR2, edit, overlay, projectWithChange, read } from './helpers.js';

describe('impact', () => {
  it('lists added, modified, affected objects, flows, ACs, views and new findings', () => {
    const { dir, id } = projectWithChange();
    runChangeEdit(dir, id, 'RULE-001');
    edit(dir, overlay(id, 'application/rules.md'), 'A payslip may only', 'A payslip may only ever');
    runNew(dir, 'capability', { module: 'HR', title: 'End probation', role: 'HR-MANAGER', change: id });
    const i = computeImpact(dir, id);
    expect(i.conflicts).toEqual([]);
    expect(i.errors).toBe(0);
    expect(i.added.map((o) => o.key)).toEqual(['CAP-HR-004']);
    expect(i.modified).toEqual([
      {
        key: 'CAP-HR-002',
        title: 'Activate employee after probation',
        file: HR2,
        fields: ['title'],
        sections: [],
      },
      {
        key: 'RULE-001',
        title: 'Only active employees are paid',
        file: 'application/rules.md',
        fields: [],
        sections: ['text'],
      },
    ]);
    expect(i.affected).toEqual(
      expect.arrayContaining([
        { id: 'FLOW-001', references: 'CAP-HR-002', via: 'steps.1.capability' },
        { id: 'CAP-PAY-001', references: 'RULE-001', via: 'rules.0' },
      ]),
    );
    expect(i.flows).toEqual(['FLOW-001']);
    expect(i.acceptanceCriteria).toEqual(['CAP-HR-002-AC-01', 'CAP-HR-004-AC-01']);
    expect(i.views).toEqual(
      expect.arrayContaining([{ file: 'modules/hr/module.md', blocks: ['capabilities', 'role-matrix'] }]),
    );
    expect(i.newFindings.map((f) => f.rule)).toEqual(['capability-without-flow']);
    expect(formatImpact(i)).toContain('## Affected flows\n\n- FLOW-001');
  });

  it('reports removals and the errors they leave', () => {
    const { dir, id } = projectWithChange();
    runChangeRemove(dir, id, 'CAP-HR-003');
    const i = computeImpact(dir, id);
    expect(i.removed).toEqual([
      { key: 'CAP-HR-003', title: 'Record employee leaving', file: 'modules/hr/capabilities/CAP-HR-003.md' },
    ]);
    expect(i.errors).toBeGreaterThan(0);
    expect(i.affected.map((a) => a.id)).toEqual(expect.arrayContaining(['FLOW-002', 'SCR-HR-01']));
  });
});

describe('apply', () => {
  it('merges, raises versions, regenerates views, updates the baseline and archives', () => {
    const { dir, id } = projectWithChange();
    runNew(dir, 'capability', { module: 'HR', title: 'End probation', role: 'HR-MANAGER', change: id });
    runChangeStatus(dir, id, 'in_review');
    runChangeStatus(dir, id, 'approved');
    const r = runApply(dir, id);
    expect(r.written).toEqual([HR2, 'modules/hr/capabilities/CAP-HR-004.md']);
    expect(r.versions).toEqual([{ key: 'CAP-HR-002', version: 2 }]);
    expect(read(dir, `spec/${HR2}`)).toMatch(/title: Activate employee after probation\n[\s\S]*version: 2/);
    expect(read(dir, 'spec/modules/hr/module.md')).toContain('[CAP-HR-004]');
    expect(existsSync(join(dir, 'spec/changes', id))).toBe(false);
    expect(read(dir, `spec/changes/archive/${id}/proposal.md`)).toMatch(
      /status: applied[\s\S]*applied: \d{4}-\d{2}-\d{2}/,
    );
    expect(readdirSync(join(dir, `spec/changes/archive/${id}/spec/modules/hr/capabilities`)).sort()).toEqual([
      'CAP-HR-002.md',
      'CAP-HR-004.md',
    ]);
    expect(readBaseline(join(dir, 'spec'))?.objects['CAP-HR-004']).toBeDefined();
    expect(runValidate(dir).findings.map((f) => f.rule)).toEqual(['capability-without-flow']);
    expect(runViews(dir, { check: true }).changed).toEqual([]);
    // IDs from the archived change are never reused
    expect(runNew(dir, 'decision', { title: 'x', change: undefined }).id).toBe('DEC-002');
  });

  it('an overlay edit the impact does not count (whitespace) is still baselined, not a direct edit', () => {
    const { dir, id } = projectWithChange();
    runChangeEdit(dir, id, 'CAP-HR-001');
    edit(dir, overlay(id, 'modules/hr/capabilities/CAP-HR-001.md'), '## Out of scope', '## Out of scope\n');
    runChangeStatus(dir, id, 'in_review');
    runChangeStatus(dir, id, 'approved');
    const r = runApply(dir, id);
    expect(r.written).toContain('modules/hr/capabilities/CAP-HR-001.md');
    expect(runValidate(dir).findings.filter((f) => f.rule === 'direct-edit')).toEqual([]);
  });

  it('applies a removal together with the references it breaks', () => {
    const { dir, id } = projectWithChange();
    runChangeRemove(dir, id, 'CAP-HR-003');
    runChangeRemove(dir, id, 'FLOW-002');
    runChangeEdit(dir, id, 'SCR-HR-01');
    edit(
      dir,
      overlay(id, 'modules/hr/screens/SCR-HR-01.md'),
      '  - id: A03\n    label: Record leaving\n    capability: CAP-HR-003\n',
      '',
    );
    runChangeEdit(dir, id, 'ENT-EMPLOYEE');
    edit(dir, overlay(id, 'application/entities/ENT-EMPLOYEE.md'), '  - from: active\n    to: left\n', '');
    edit(
      dir,
      overlay(id, 'application/entities/ENT-EMPLOYEE.md'),
      'states: [draft, active, left]',
      'states: [draft, active]',
    );
    runChangeEdit(dir, id, 'CAP-HR-002');
    edit(dir, overlay(id, HR2), 'ops: [R, U]', 'ops: [R, U, A]');
    // The experience screen and its mockup must follow in the same change.
    expect(() => runChangeStatus(dir, id, 'in_review')).toThrow(/lint error/);
    expect(runExperienceSync(dir, 'SCR-HR-01', { change: id }).removed).toEqual(['SCR-HR-01.A03']);
    expect(runExperienceReviewed(dir, 'SCR-HR-01', { change: id }).findings).toEqual([]);
    runChangeStatus(dir, id, 'in_review');
    runChangeStatus(dir, id, 'approved');
    const r = runApply(dir, id);
    expect(r.deleted).toEqual(['application/flows/FLOW-002.md', 'modules/hr/capabilities/CAP-HR-003.md']);
    expect(runValidate(dir).findings).toEqual([]);
    expect(readBaseline(join(dir, 'spec'))?.objects['CAP-HR-003']).toBeUndefined();
  });
});
