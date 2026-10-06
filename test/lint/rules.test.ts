import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RULES } from '../../src/lint/rules/index.js';
import { FIXTURE, defaultConfig, lintFixture, replace, type Edit } from '../fixture.js';

const HR1 = 'modules/hr/capabilities/CAP-HR-001.md';
const HR2 = 'modules/hr/capabilities/CAP-HR-002.md';
const HR3 = 'modules/hr/capabilities/CAP-HR-003.md';
const PAY1 = 'modules/pay/capabilities/CAP-PAY-001.md';
const PAY2 = 'modules/pay/capabilities/CAP-PAY-002.md';
const GLB1 = 'modules/glb/capabilities/CAP-GLB-001.md';
const EMP = 'application/entities/ENT-EMPLOYEE.md';
const append = (text: string) => (s: string) => s + text;
const original = (path: string) => readFileSync(join(FIXTURE, 'spec', path), 'utf8');

interface Case {
  label: string;
  edits: Record<string, Edit>;
  expect: { file: string; line?: number; message?: RegExp };
}

const CASES: Record<string, Case[]> = {
  'yaml-syntax': [
    {
      label: 'broken front-matter',
      edits: { [HR1]: replace('status: ready', 'status: [ready') },
      expect: { file: HR1 },
    },
    {
      label: 'broken item yaml',
      edits: { 'application/rules.md': replace('status: draft', 'status: "draft') },
      expect: { file: 'application/rules.md' },
    },
  ],
  schema: [
    {
      label: 'unknown status',
      edits: { [HR1]: replace('status: ready', 'status: done') },
      expect: { file: HR1, line: 5, message: /status/ },
    },
    {
      label: 'item with wrong prefix',
      edits: {
        'application/events.md': append(
          '\n## RULE-002 Misplaced\n\n```yaml\nid: RULE-002\ntitle: Misplaced\nstatus: draft\n```\n',
        ),
      },
      expect: { file: 'application/events.md', message: /does not belong/ },
    },
    {
      label: 'missing front-matter',
      edits: { 'application/flows/FLOW-003.md': '# No front-matter\n' },
      expect: { file: 'application/flows/FLOW-003.md', line: 1 },
    },
  ],
  'unrecognized-file': [
    {
      label: 'stray file',
      edits: { 'modules/hr/notes.md': '# Notes\n' },
      expect: { file: 'modules/hr/notes.md' },
    },
  ],
  'duplicate-id': [
    {
      label: 'role defined twice',
      edits: {
        'application/personas-roles.md': append(
          '\n## ROLE-EMPLOYEE Employee again\n\n```yaml\nid: ROLE-EMPLOYEE\ntitle: Employee again\n```\n',
        ),
      },
      expect: { file: 'application/personas-roles.md', message: /already defined/ },
    },
  ],
  'id-location': [
    {
      label: 'file name differs from ID',
      edits: { 'modules/hr/capabilities/CAP-HR-009.md': original(HR3), [HR3]: null },
      expect: { file: 'modules/hr/capabilities/CAP-HR-009.md', message: /CAP-HR-003\.md/ },
    },
    {
      label: 'module rule in application rules',
      edits: {
        'application/rules.md': append(
          '\n## RULE-HR-002 Misplaced\n\n```yaml\nid: RULE-HR-002\ntitle: Misplaced\nstatus: draft\n```\n',
        ),
      },
      expect: { file: 'application/rules.md', message: /modules\/hr\/rules\.md/ },
    },
    {
      label: 'heading does not match ID',
      edits: { 'application/rules.md': replace('## RULE-001 Only', '## RULE-002 Only') },
      expect: { file: 'application/rules.md', message: /heading should start with RULE-001/ },
    },
  ],
  'unknown-reference': [
    {
      label: 'missing rule',
      edits: { [HR2]: replace('rules: []', 'rules: [RULE-999]') },
      expect: { file: HR2, line: 15, message: /RULE-999/ },
    },
    {
      label: 'missing role in flow',
      edits: { 'application/flows/FLOW-002.md': replace('roles: [ROLE-HR-MANAGER]', 'roles: [ROLE-NOBODY]') },
      expect: { file: 'application/flows/FLOW-002.md', line: 5 },
    },
  ],
  'module-registry': [
    {
      label: 'module not listed',
      edits: { 'application/application.md': replace('  - MOD-PAY\n', '') },
      expect: { file: 'modules/pay/module.md', message: /not listed/ },
    },
    {
      label: 'listed module without file',
      edits: { 'application/application.md': replace('  - MOD-PAY\n', '  - MOD-PAY\n  - MOD-INV\n') },
      expect: { file: 'application/application.md', line: 17 },
    },
    {
      label: 'folder without module.md',
      edits: { 'modules/inv/capabilities/x.md': '# x\n' },
      expect: { file: 'modules/inv/module.md' },
    },
  ],
  'invalid-transition': [
    {
      label: 'unknown transition',
      edits: { [HR2]: replace('[draft->active]', '[draft->left]') },
      expect: { file: HR2, line: 14 },
    },
  ],
  'transition-coverage': [
    {
      label: 'uncovered transition',
      edits: { [HR3]: replace('[active->left]', '[]') },
      expect: { file: EMP, line: 17, message: /active->left/ },
    },
  ],
  'lifecycle-coverage': [
    {
      label: 'nobody archives',
      edits: { [HR3]: replace('ops: [R, U, A]', 'ops: [R, U]') },
      expect: { file: EMP, message: /A or D/ },
    },
  ],
  'orphan-screen': [
    {
      label: 'screen not listed',
      edits: { [GLB1]: replace('screens: [SCR-GLB-01]', 'screens: []') },
      expect: { file: 'modules/glb/screens/SCR-GLB-01.md' },
    },
  ],
  'orphan-entity': [
    {
      label: 'unused entity',
      edits: {
        'application/entities/ENT-DEPARTMENT.md':
          '---\nid: ENT-DEPARTMENT\ntitle: Department\nstatus: draft\n---\n\n# Department\n',
      },
      expect: { file: 'application/entities/ENT-DEPARTMENT.md' },
    },
  ],
  'event-consumed-without-emitter': [
    {
      label: 'nobody emits',
      edits: { [HR2]: replace('emits: [EVT-EMPLOYEE-HIRED]', 'emits: []') },
      expect: { file: PAY1, line: 17 },
    },
  ],
  'event-emitted-not-consumed': [
    {
      label: 'nobody consumes',
      edits: { [PAY1]: replace('consumes: [EVT-EMPLOYEE-HIRED]', 'consumes: []') },
      expect: { file: 'application/events.md', line: 3 },
    },
  ],
  'capability-without-flow': [
    {
      label: 'capability in no flow',
      edits: { 'application/flows/FLOW-002.md': null, [HR3]: replace('flows: [FLOW-002]', 'flows: []') },
      expect: { file: HR3 },
    },
  ],
  'flow-backlink': [
    {
      label: 'capability does not list its flow',
      edits: { [HR2]: replace('flows: [FLOW-001]', 'flows: []') },
      expect: { file: HR2, message: /FLOW-001 step 2/ },
    },
    {
      label: 'capability lists a flow that does not use it',
      edits: { [HR3]: replace('flows: [FLOW-002]', 'flows: [FLOW-002, FLOW-001]') },
      expect: { file: HR3, line: 18 },
    },
  ],
  'screen-backlink': [
    {
      label: 'action capability does not list screen',
      edits: { [HR3]: replace('screens: [SCR-HR-01]', 'screens: []') },
      expect: { file: HR3, line: 10 },
    },
  ],
  'foreign-module-rule': [
    {
      label: "other module's rule",
      edits: { [PAY2]: replace('rules: [RULE-001]', 'rules: [RULE-001, RULE-HR-001]') },
      expect: { file: PAY2, line: 15 },
    },
  ],
  'acceptance-ids': [
    {
      label: 'wrong AC number',
      edits: { [HR2]: replace('### CAP-HR-002-AC-01', '### CAP-HR-002-AC-02') },
      expect: { file: HR2, message: /should be CAP-HR-002-AC-01/ },
    },
    {
      label: 'AC with another capability ID',
      edits: { [HR2]: replace('### CAP-HR-002-AC-01', '### CAP-HR-001-AC-01') },
      expect: { file: HR2 },
    },
    {
      label: 'ready without AC',
      edits: { [HR1]: replace('### CAP-HR-001-AC-01', 'No criteria yet.') },
      expect: { file: HR1, line: 5, message: /no acceptance criteria/ },
    },
  ],
  placeholder: [
    {
      label: 'unfilled placeholder',
      edits: { 'application/nfr.md': append('\nOwner: {{owner}}\n') },
      expect: { file: 'application/nfr.md', line: 7 },
    },
  ],
  'generated-edited': [
    {
      label: 'edited block',
      edits: {
        'modules/pay/module.md': replace(
          '| draft | ROLE-ACCOUNTANT (org) |',
          '| ready | ROLE-ACCOUNTANT (org) |',
        ),
      },
      expect: { file: 'modules/pay/module.md', line: 16 },
    },
    {
      label: 'edited generated file',
      edits: { '_generated/coverage.md': append('extra\n') },
      expect: { file: '_generated/coverage.md', line: 1 },
    },
  ],
  'generated-missing': [
    {
      label: 'block removed',
      edits: {
        'modules/pay/module.md': (s) =>
          s.replace(/<!-- GENERATED:start screens[\s\S]*?<!-- GENERATED:end -->/, ''),
      },
      expect: { file: 'modules/pay/module.md', message: /"screens"/ },
    },
  ],
  'views-stale': [
    {
      label: 'title changed',
      edits: { [HR1]: replace('title: Register employee', 'title: Register new employee') },
      expect: { file: 'modules/hr/module.md', line: 16 },
    },
    {
      label: 'generated file missing',
      edits: { '_generated/role-matrix.md': null },
      expect: { file: '_generated/role-matrix.md' },
    },
  ],
  'glossary-forbidden': [
    {
      label: 'forbidden synonym',
      edits: { 'application/nfr.md': append('\nEvery worker gets a Salary Slip.\n') },
      expect: { file: 'application/nfr.md', line: 7 },
    },
  ],
  'tech-leak': [
    {
      label: 'technology word',
      edits: { 'application/nfr.md': append('\nPayslips are stored in a database.\n') },
      expect: { file: 'application/nfr.md', line: 7, message: /database/ },
    },
  ],
};

describe('valid fixture', () => {
  it('has no findings', () => {
    expect(lintFixture()).toEqual([]);
  });
});

it('every rule has test cases', () => {
  expect(Object.keys(CASES).sort()).toEqual(RULES.map((r) => r.name).sort());
});

for (const rule of RULES) {
  describe(rule.name, () => {
    for (const c of CASES[rule.name] ?? []) {
      it(`reports: ${c.label}`, () => {
        const hits = lintFixture(c.edits).filter((f) => f.rule === rule.name);
        expect(hits.length, JSON.stringify(lintFixture(c.edits), null, 1)).toBeGreaterThan(0);
        const hit = hits.find(
          (f) => f.file === c.expect.file && (c.expect.line === undefined || f.line === c.expect.line),
        );
        expect(
          hit,
          `expected ${c.expect.file}:${c.expect.line ?? '*'} in ${JSON.stringify(hits, null, 1)}`,
        ).toBeDefined();
        if (c.expect.message) expect(hit?.message).toMatch(c.expect.message);
        expect(hit?.severity).toBe(rule.severity);
      });
    }
  });
}

describe('severity overrides', () => {
  const edits = {
    'application/nfr.md': append('\nPayslips are stored in a database.\n'),
    'application/entities/ENT-DEPARTMENT.md':
      '---\nid: ENT-DEPARTMENT\ntitle: Department\nstatus: draft\n---\n',
  };
  it('applies error / off from config', () => {
    const config = defaultConfig();
    config.lint.rules = { 'tech-leak': 'error', 'orphan-entity': 'off' };
    const findings = lintFixture(edits, config);
    expect(findings.find((f) => f.rule === 'tech-leak')?.severity).toBe('error');
    expect(findings.some((f) => f.rule === 'orphan-entity')).toBe(false);
  });
});

describe('no cascades', () => {
  it('a capability with an invalid schema is not reported again as unknown', () => {
    const findings = lintFixture({ [HR1]: replace('status: ready', 'status: done') });
    expect(findings.filter((f) => f.rule === 'unknown-reference')).toEqual([]);
  });
});
