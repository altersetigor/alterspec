import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runNew, type NewOptions, type NewType } from '../src/commands/new.js';
import { runValidate } from '../src/commands/validate.js';
import { copyFixture } from './fixture.js';

const errors = (dir: string) => runValidate(dir).findings.filter((f) => f.severity === 'error');
const read = (dir: string, p: string) => readFileSync(join(dir, p), 'utf8');

describe('alterspec new', () => {
  const cases: [NewType, NewOptions, string, string][] = [
    ['module', { code: 'inv', title: 'Invoicing' }, 'MOD-INV', 'spec/modules/inv/module.md'],
    [
      'capability',
      { module: 'HR', title: 'Change start date', role: 'HR-MANAGER', scope: 'org' },
      'CAP-HR-004',
      'spec/modules/hr/capabilities/CAP-HR-004.md',
    ],
    [
      'screen',
      { module: 'pay', title: 'Payslip details' },
      'SCR-PAY-02',
      'spec/modules/pay/screens/SCR-PAY-02.md',
    ],
    [
      'screen',
      { module: 'GLB', title: 'Notifications' },
      'SCR-GLB-02',
      'spec/modules/glb/screens/SCR-GLB-02.md',
    ],
    [
      'entity',
      { name: 'department', title: 'Department' },
      'ENT-DEPARTMENT',
      'spec/application/entities/ENT-DEPARTMENT.md',
    ],
    [
      'flow',
      { title: 'Correct a payslip', capability: 'CAP-PAY-002' },
      'FLOW-003',
      'spec/application/flows/FLOW-003.md',
    ],
    ['rule', { title: 'Payslips are final once issued' }, 'RULE-002', 'spec/application/rules.md'],
    [
      'rule',
      { title: 'An employee leaves on a working day', module: 'HR' },
      'RULE-HR-002',
      'spec/modules/hr/rules.md',
    ],
    ['rule', { title: 'Net amount is positive', module: 'PAY' }, 'RULE-PAY-001', 'spec/modules/pay/rules.md'],
    [
      'event',
      { name: 'payslip-issued', title: 'Payslip issued' },
      'EVT-PAYSLIP-ISSUED',
      'spec/application/events.md',
    ],
    [
      'persona',
      { name: 'auditor', title: 'Auditor: external' },
      'PER-AUDITOR',
      'spec/application/personas-roles.md',
    ],
    ['role', { name: 'auditor', title: 'Auditor' }, 'ROLE-AUDITOR', 'spec/application/personas-roles.md'],
    ['decision', { title: 'Who approves corrections?' }, 'DEC-002', 'spec/application/decisions.md'],
    [
      'term',
      { term: 'Pay period', forbidden: 'pay run, cycle' },
      'Pay period',
      'spec/application/glossary.md',
    ],
  ];

  for (const [type, opts, id, file] of cases) {
    it(`${type} ${JSON.stringify(opts)} → ${id}`, () => {
      const dir = copyFixture();
      const result = runNew(dir, type, opts);
      expect(result.id).toBe(id);
      expect(result.file).toBe(file);
      const content = read(dir, file);
      expect(content).not.toMatch(/\{\{/);
      expect(content.split('\n')[result.line - 1]).toMatch(
        type === 'term' ? /^## Pay period/ : new RegExp(`^(---|## ${id})`),
      );
      expect(errors(dir)).toEqual([]);
    });
  }

  it('registers a new module in application.md and keeps its comments', () => {
    const dir = copyFixture();
    const app = join(dir, 'spec/application/application.md');
    writeFileSync(
      app,
      read(dir, 'spec/application/application.md').replace('modules:\n', '# keep me\nmodules:\n'),
    );
    runNew(dir, 'module', { code: 'INV', title: 'Invoicing' });
    const text = read(dir, 'spec/application/application.md');
    expect(text).toContain('# keep me');
    expect(text).toMatch(/modules:\n {2}- MOD-GLB\n {2}- MOD-HR\n {2}- MOD-PAY\n {2}- MOD-INV\n/);
  });

  it('a new flow is listed by its first capability', () => {
    const dir = copyFixture();
    runNew(dir, 'flow', { title: 'Correct a payslip', capability: 'CAP-PAY-002' });
    expect(read(dir, 'spec/modules/pay/capabilities/CAP-PAY-002.md')).toMatch(
      /flows:\n {2}- FLOW-001\n {2}- FLOW-003\n/,
    );
  });

  it('never reuses an ID that only appears in the archive', () => {
    const dir = copyFixture();
    mkdirSync(join(dir, 'spec/changes/archive/CHG-001'), { recursive: true });
    writeFileSync(
      join(dir, 'spec/changes/archive/CHG-001/proposal.md'),
      'Removed CAP-HR-007 and FLOW-009.\n',
    );
    expect(runNew(dir, 'capability', { module: 'HR', title: 'X', role: 'ROLE-HR-MANAGER' }).id).toBe(
      'CAP-HR-008',
    );
    expect(runNew(dir, 'flow', { title: 'Y', capability: 'CAP-HR-001' }).id).toBe('FLOW-010');
  });

  it('puts personas above the roles heading', () => {
    const dir = copyFixture();
    runNew(dir, 'persona', { name: 'auditor', title: 'Auditor', role: 'ROLE-HR-MANAGER' });
    const text = read(dir, 'spec/application/personas-roles.md');
    expect(text.indexOf('## PER-AUDITOR')).toBeLessThan(text.indexOf('# Roles'));
  });

  it('escapes titles so the YAML stays valid', () => {
    const dir = copyFixture();
    runNew(dir, 'capability', { module: 'HR', title: 'Fix "start": date', role: 'HR-MANAGER' });
    runNew(dir, 'rule', { title: 'Rule: with colon' });
    expect(errors(dir)).toEqual([]);
  });

  const failures: [NewType, NewOptions, RegExp][] = [
    ['capability', { module: 'HR', title: 'X' }, /needs --role/],
    ['capability', { module: 'INV', title: 'X', role: 'HR-MANAGER' }, /MOD-INV doesn't exist/],
    ['capability', { module: 'HR', title: 'X', role: 'NOBODY' }, /ROLE-NOBODY doesn't exist/],
    ['capability', { module: 'HR', title: 'X', role: 'HR-MANAGER', scope: 'world' }, /--scope/],
    ['entity', { name: 'EMPLOYEE', title: 'Again' }, /ENT-EMPLOYEE already exists/],
    ['module', { code: 'HR', title: 'Again' }, /MOD-HR already exists/],
    ['module', { code: 'H', title: 'Too short' }, /not a valid module ID/],
    ['flow', { title: 'X', capability: 'CAP-HR-099' }, /CAP-HR-099 doesn't exist/],
    ['term', { term: 'employee' }, /already in the glossary/],
    ['decision', { title: 'X', kind: 'guess' }, /--kind/],
    ['bogus' as NewType, {}, /unknown type/],
  ];
  for (const [type, opts, message] of failures) {
    it(`refuses ${type} ${JSON.stringify(opts)}`, () => {
      const dir = copyFixture();
      expect(() => runNew(dir, type, opts)).toThrow(message);
    });
  }
});
