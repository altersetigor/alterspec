import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatShow, runShow } from '../src/commands/show.js';
import { copyFixture, FIXTURE } from './fixture.js';

describe('alterspec show', () => {
  it('capability: references both ways, sections, acceptance criteria', () => {
    const r = runShow(FIXTURE, 'cap-hr-002');
    expect(r).toMatchObject({
      id: 'CAP-HR-002',
      kind: 'capability',
      title: 'Activate employee',
      file: 'spec/modules/hr/capabilities/CAP-HR-002.md',
      line: 1,
    });
    expect(r.references).toEqual(
      expect.arrayContaining([
        {
          id: 'ROLE-HR-MANAGER',
          title: 'HR manager',
          file: 'spec/application/personas-roles.md',
          via: 'roles.0',
        },
        expect.objectContaining({ id: 'ENT-EMPLOYEE', via: 'entities.0' }),
        expect.objectContaining({ id: 'EVT-EMPLOYEE-HIRED', via: 'events.emits.0' }),
        expect.objectContaining({ id: 'CAP-HR-001', via: 'depends_on.0' }),
      ]),
    );
    expect(r.referencedBy.map((x) => `${x.id} ${x.via}`).sort()).toEqual([
      'FLOW-001 steps.1.capability',
      'SCR-HR-01 actions.1',
    ]);
    expect(r.acceptanceCriteria).toEqual(['CAP-HR-002-AC-01']);
    expect(r.sections?.find((s) => s.heading === 'Main flow')).toEqual({
      heading: 'Main flow',
      empty: false,
      missing: false,
    });
    expect(r.sections?.find((s) => s.heading === 'Notifications')).toEqual({
      heading: 'Notifications',
      empty: true,
      missing: true,
    });
    expect(r.findings).toEqual([]);
  });

  it('entity and event: who uses them', () => {
    expect(runShow(FIXTURE, 'ENT-PAYSLIP').referencedBy.map((x) => x.id)).toEqual(
      expect.arrayContaining([
        'CAP-PAY-001',
        'CAP-PAY-002',
        'CAP-GLB-001',
        'RULE-001',
        'DEC-001',
        'EVT-BANK-PAYMENT-CONFIRMED',
      ]),
    );
    expect(
      runShow(FIXTURE, 'EVT-EMPLOYEE-HIRED')
        .referencedBy.map((x) => `${x.id} ${x.via}`)
        .sort(),
    ).toEqual(['CAP-HR-002 events.emits.0', 'CAP-PAY-001 events.consumes.0']);
  });

  it('screen sections and open questions', () => {
    const r = runShow(FIXTURE, 'SCR-GLB-01');
    expect(r.sections?.map((s) => s.heading)).toEqual([
      'Purpose',
      'Entry points',
      'Displayed data',
      'Actions',
      'Per-role differences',
      'Business states',
    ]);
    expect(runShow(FIXTURE, 'ENT-PAYSLIP').openQuestions).toEqual([
      { id: 'DEC-001', title: 'Payslip language' },
    ]);
  });

  it("includes the object's own findings", () => {
    const dir = copyFixture();
    const file = join(dir, 'spec/modules/hr/capabilities/CAP-HR-002.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace('rules: []', 'rules: [RULE-999]'));
    const r = runShow(dir, 'CAP-HR-002');
    expect(r.references).toContainEqual({
      id: 'RULE-999',
      title: undefined,
      file: undefined,
      via: 'rules.0',
    });
    expect(r.findings.map((f) => f.rule)).toContain('unknown-reference');
    expect(formatShow(r)).toMatch(/RULE-999 \(missing\)/);
  });

  it('experience screen: its business screen and its template sections', () => {
    const r = runShow(FIXTURE, 'UX-SCR-HR-01');
    expect(r).toMatchObject({ id: 'UX-SCR-HR-01', kind: 'experience' });
    expect(r.references.map((x) => x.id)).toContain('SCR-HR-01');
    expect(r.sections?.map((s) => s.heading)).toContain('Interactions');
  });

  it('fails clearly for unknown IDs', () => {
    expect(() => runShow(FIXTURE, 'CAP-HR-999')).toThrow(/CAP-HR-999 not found/);
  });
});
