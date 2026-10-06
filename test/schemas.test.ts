import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import {
  ApplicationSchema,
  CapabilitySchema,
  ChangeSchema,
  ConfigSchema,
  DecisionItemSchema,
  EntitySchema,
  EventItemSchema,
  FlowSchema,
  GlossaryItemSchema,
  ID_REGEX,
  ModuleSchema,
  PersonaItemSchema,
  RoleItemSchema,
  RuleItemSchema,
  ScreenSchema,
  idKind,
  type IdKind,
} from '../src/schemas/index.js';
import { issues } from './helpers.js';

describe('ID formats', () => {
  const valid: Record<IdKind, string[]> = {
    app: ['APP'],
    module: ['MOD-HR', 'MOD-GLB', 'MOD-INVOIC'],
    capability: ['CAP-HR-004'],
    screen: ['SCR-HR-02', 'SCR-GLB-01'],
    role: ['ROLE-HR-MANAGER', 'ROLE-ACCOUNTANT'],
    persona: ['PER-HR-LEAD'],
    entity: ['ENT-EMPLOYEE', 'ENT-LEAVE-REQUEST'],
    rule: ['RULE-012', 'RULE-HR-003'],
    flow: ['FLOW-003'],
    event: ['EVT-EMPLOYEE-HIRED'],
    decision: ['DEC-001'],
    change: ['CHG-010'],
    acceptance: ['CAP-HR-004-AC-01'],
    screenAction: ['A01'],
  };
  const invalid: Record<IdKind, string[]> = {
    app: ['APP-1', 'app'],
    module: ['MOD-H', 'MOD-hr', 'MOD-TOOLONG1'],
    capability: ['CAP-HR-4', 'CAP-HR-0004', 'CAP-hr-004'],
    screen: ['SCR-HR-2', 'SCR-HR-002'],
    role: ['ROLE-', 'ROLE-hr', 'ROLE-HR--X'],
    persona: ['PER-'],
    entity: ['ENT-employee'],
    rule: ['RULE-12', 'RULE-H-001'],
    flow: ['FLOW-3'],
    event: ['EVT-'],
    decision: ['DEC-1'],
    change: ['CHG-1'],
    acceptance: ['CAP-HR-004-AC-1'],
    screenAction: ['A1', 'B01'],
  };
  for (const kind of Object.keys(valid) as IdKind[]) {
    it(`${kind}`, () => {
      for (const id of valid[kind]) expect(ID_REGEX[kind].test(id), id).toBe(true);
      for (const id of invalid[kind]) expect(ID_REGEX[kind].test(id), id).toBe(false);
    });
  }
  it('detects the kind of an ID', () => {
    expect(idKind('CAP-HR-004')).toBe('capability');
    expect(idKind('RULE-HR-003')).toBe('rule');
    expect(idKind('nonsense')).toBeUndefined();
  });
});

const capability = {
  id: 'CAP-HR-004',
  title: 'Hire employee',
  module: 'MOD-HR',
  status: 'draft',
  version: 1,
  roles: [{ role: 'ROLE-HR-MANAGER', scope: 'org' }],
  screens: ['SCR-HR-02'],
  entities: [{ entity: 'ENT-EMPLOYEE', ops: ['C', 'R', 'U'], transitions: ['draft->active'] }],
  rules: ['RULE-012', 'RULE-HR-001'],
  events: { emits: ['EVT-EMPLOYEE-HIRED'], consumes: [] },
  depends_on: ['CAP-HR-001'],
  flows: ['FLOW-003'],
};

const screen = {
  id: 'SCR-HR-02',
  title: 'Employee details',
  module: 'MOD-HR',
  status: 'draft',
  roles: [{ role: 'ROLE-HR-MANAGER', scope: 'org' }],
  entry_points: ['SCR-HR-01'],
  actions: [{ id: 'A01', label: 'Hire', capability: 'CAP-HR-004' }],
  mockups: [{ type: 'figma', ref: 'https://figma.example/file/abc' }],
};

const entity = {
  id: 'ENT-EMPLOYEE',
  title: 'Employee',
  status: 'draft',
  attributes: [{ name: 'Full name', kind: 'text', required: true }],
  relationships: [{ entity: 'ENT-DEPARTMENT', cardinality: 'one' }],
  states: ['draft', 'active', 'left'],
  initial_state: 'draft',
  transitions: [
    { from: 'draft', to: 'active' },
    { from: 'active', to: 'left' },
  ],
};

const flow = {
  id: 'FLOW-003',
  title: 'Hire to first payroll',
  status: 'draft',
  roles: ['ROLE-HR-MANAGER'],
  steps: [
    { step: 1, capability: 'CAP-HR-004' },
    { step: 2, capability: 'CAP-PAY-001', role: 'ROLE-ACCOUNTANT' },
  ],
};

interface Case {
  name: string;
  schema: z.ZodType;
  valid: Record<string, unknown>;
  invalid: [string, Record<string, unknown>][];
}

const cases: Case[] = [
  {
    name: 'capability',
    schema: CapabilitySchema,
    valid: capability,
    invalid: [
      ['bad ID', { ...capability, id: 'CAP-HR-4' }],
      ['wrong status', { ...capability, status: 'done' }],
      ['missing roles', { ...capability, roles: [] }],
      ['bad scope', { ...capability, roles: [{ role: 'ROLE-HR-MANAGER', scope: 'everyone' }] }],
      ['ID from another module', { ...capability, module: 'MOD-PAY' }],
      [
        'bad transition',
        {
          ...capability,
          entities: [{ entity: 'ENT-EMPLOYEE', ops: ['C'], transitions: ['draft to active'] }],
        },
      ],
      ['bad op', { ...capability, entities: [{ entity: 'ENT-EMPLOYEE', ops: ['X'] }] }],
      ['unknown field', { ...capability, endpoint: '/hire' }],
    ],
  },
  {
    name: 'screen',
    schema: ScreenSchema,
    valid: screen,
    invalid: [
      ['bad ID', { ...screen, id: 'SCR-HR-2' }],
      ['ID from another module', { ...screen, module: 'MOD-PAY' }],
      ['bad mockup type', { ...screen, mockups: [{ type: 'sketch', ref: 'x' }] }],
      ['action without capability', { ...screen, actions: [{ id: 'A01', label: 'Hire' }] }],
      ['duplicate actions', { ...screen, actions: [screen.actions[0], screen.actions[0]] }],
    ],
  },
  {
    name: 'entity',
    schema: EntitySchema,
    valid: entity,
    invalid: [
      ['technical attribute kind', { ...entity, attributes: [{ name: 'Name', kind: 'varchar' }] }],
      ['transition to unknown state', { ...entity, transitions: [{ from: 'draft', to: 'archived' }] }],
      ['unknown initial state', { ...entity, initial_state: 'new' }],
      ['bad state name', { ...entity, states: ['Active'] }],
    ],
  },
  {
    name: 'flow',
    schema: FlowSchema,
    valid: flow,
    invalid: [
      ['no steps', { ...flow, steps: [] }],
      ['misnumbered steps', { ...flow, steps: [{ step: 2, capability: 'CAP-HR-004' }] }],
      ['step without capability', { ...flow, steps: [{ step: 1 }] }],
    ],
  },
  {
    name: 'module',
    schema: ModuleSchema,
    valid: { id: 'MOD-HR', title: 'Human resources', status: 'draft', depends_on: ['MOD-GLB'] },
    invalid: [['bad ID', { id: 'HR', title: 'x', status: 'draft' }]],
  },
  {
    name: 'application',
    schema: ApplicationSchema,
    valid: {
      id: 'APP',
      title: 'Demo',
      status: 'draft',
      version: 1,
      channels: [{ name: 'Backoffice', kind: 'backoffice' }],
      modules: ['MOD-HR'],
    },
    invalid: [
      [
        'bad channel kind',
        { id: 'APP', title: 'Demo', status: 'draft', version: 1, channels: [{ name: 'X', kind: 'ios' }] },
      ],
      ['version 0', { id: 'APP', title: 'Demo', status: 'draft', version: 0 }],
    ],
  },
  {
    name: 'change',
    schema: ChangeSchema,
    valid: {
      id: 'CHG-001',
      title: 'Add probation',
      status: 'draft',
      created: '2026-10-06',
      removes: ['CAP-HR-003', 'term:Worker', 'file:application/nfr.md'],
      base: { 'CAP-HR-002': 'abc', 'CAP-HR-010': null },
    },
    invalid: [
      ['bad date', { id: 'CHG-001', title: 'x', status: 'draft', created: '06.10.2026' }],
      [
        'bad removed key',
        { id: 'CHG-001', title: 'x', status: 'draft', created: '2026-10-06', removes: ['foo'] },
      ],
      [
        'bad base key',
        { id: 'CHG-001', title: 'x', status: 'draft', created: '2026-10-06', base: { foo: null } },
      ],
      ['lifecycle status', { id: 'CHG-001', title: 'x', status: 'implemented', created: '2026-10-06' }],
    ],
  },
  {
    name: 'rule item',
    schema: RuleItemSchema,
    valid: {
      id: 'RULE-HR-001',
      title: 'Probation lasts 3 months',
      status: 'draft',
      entities: ['ENT-EMPLOYEE'],
    },
    invalid: [['bad ID', { id: 'R-1', title: 'x', status: 'draft' }]],
  },
  {
    name: 'event item',
    schema: EventItemSchema,
    valid: { id: 'EVT-EMPLOYEE-HIRED', title: 'Employee hired', external: false },
    invalid: [['bad entity', { id: 'EVT-X', title: 'x', entities: ['EMPLOYEE'] }]],
  },
  {
    name: 'persona item',
    schema: PersonaItemSchema,
    valid: { id: 'PER-HR-LEAD', title: 'HR lead', roles: ['ROLE-HR-MANAGER'] },
    invalid: [['role given as persona', { id: 'ROLE-HR', title: 'x' }]],
  },
  {
    name: 'role item',
    schema: RoleItemSchema,
    valid: { id: 'ROLE-HR-MANAGER', title: 'HR manager' },
    invalid: [['missing title', { id: 'ROLE-HR-MANAGER' }]],
  },
  {
    name: 'decision item',
    schema: DecisionItemSchema,
    valid: {
      id: 'DEC-001',
      title: 'Probation length',
      kind: 'decision',
      status: 'decided',
      date: '2026-10-06',
    },
    invalid: [['bad kind', { id: 'DEC-001', title: 'x', kind: 'idea', status: 'open' }]],
  },
  {
    name: 'glossary item',
    schema: GlossaryItemSchema,
    valid: { term: 'Employee', forbidden: ['worker', 'staff member'] },
    invalid: [['empty term', { term: '' }]],
  },
  {
    name: 'config',
    schema: ConfigSchema,
    valid: {
      version: '0.0.1',
      language: 'en',
      lint: { rules: { 'tech-leak': 'warn' }, tech_terms: ['SQL'] },
    },
    invalid: [
      ['bilingual not in v1', { version: '0.0.1', language: 'sr' }],
      ['bad severity', { version: '0.0.1', language: 'en', lint: { rules: { x: 'fatal' } } }],
    ],
  },
];

for (const c of cases) {
  describe(`${c.name} schema`, () => {
    it('accepts a valid object', () => {
      expect(issues(c.schema.safeParse(c.valid))).toEqual([]);
    });
    for (const [label, value] of c.invalid) {
      it(`rejects: ${label}`, () => {
        expect(c.schema.safeParse(value).success).toBe(false);
      });
    }
  });
}
