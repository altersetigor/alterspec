import { z } from 'zod';
import { ApplicationSchema } from './application.js';
import { CapabilitySchema } from './capability.js';
import { ChangeSchema } from './change.js';
import {
  DecisionItemSchema,
  EventItemSchema,
  GlossaryItemSchema,
  PersonaItemSchema,
  RoleItemSchema,
  RuleItemSchema,
} from './collections.js';
import { ConfigSchema } from './config.js';
import { EntitySchema } from './entity.js';
import { ExperienceScreenSchema } from './experience.js';
import { FlowSchema } from './flow.js';
import { ModuleSchema } from './module.js';
import { ScreenSchema } from './screen.js';

export * from './application.js';
export * from './capability.js';
export * from './change.js';
export * from './collections.js';
export * from './common.js';
export * from './config.js';
export * from './entity.js';
export * from './experience.js';
export * from './flow.js';
export * from './ids.js';
export * from './module.js';
export * from './screen.js';

/** A spec file whose YAML front-matter describes one object. */
export interface DocumentType {
  kind: 'document';
  schema: z.ZodType;
  template: string;
  /** Location inside spec/, with <mod> / <ID> placeholders. */
  location: string;
}

/** A spec file holding many `## <ID> <Title>` items, each with a yaml block. */
export interface CollectionType {
  kind: 'collection';
  /** Item schema, chosen by the item's ID prefix (or `*` for un-ID'd items like glossary terms). */
  items: Record<string, z.ZodType>;
  template: string;
  location: string;
}

export const SPEC_TYPES = {
  application: {
    kind: 'document',
    schema: ApplicationSchema,
    template: 'application.md',
    location: 'application/application.md',
  },
  module: {
    kind: 'document',
    schema: ModuleSchema,
    template: 'module.md',
    location: 'modules/<mod>/module.md',
  },
  capability: {
    kind: 'document',
    schema: CapabilitySchema,
    template: 'capability.md',
    location: 'modules/<mod>/capabilities/<ID>.md',
  },
  screen: {
    kind: 'document',
    schema: ScreenSchema,
    template: 'screen.md',
    location: 'modules/<mod>/screens/<ID>.md',
  },
  entity: {
    kind: 'document',
    schema: EntitySchema,
    template: 'entity.md',
    location: 'application/entities/<ID>.md',
  },
  flow: { kind: 'document', schema: FlowSchema, template: 'flow.md', location: 'application/flows/<ID>.md' },
  experience: {
    kind: 'document',
    schema: ExperienceScreenSchema,
    template: 'experience-screen.md',
    location: 'experience/screens/<ID>.md',
  },
  change: {
    kind: 'document',
    schema: ChangeSchema,
    template: 'change-proposal.md',
    location: 'changes/<ID>/proposal.md',
  },
  'personas-roles': {
    kind: 'collection',
    items: { PER: PersonaItemSchema, ROLE: RoleItemSchema },
    template: 'personas-roles.md',
    location: 'application/personas-roles.md',
  },
  glossary: {
    kind: 'collection',
    items: { '*': GlossaryItemSchema },
    template: 'glossary.md',
    location: 'application/glossary.md',
  },
  rules: {
    kind: 'collection',
    items: { RULE: RuleItemSchema },
    template: 'rules.md',
    location: 'application/rules.md',
  },
  'module-rules': {
    kind: 'collection',
    items: { RULE: RuleItemSchema },
    template: 'module-rules.md',
    location: 'modules/<mod>/rules.md',
  },
  events: {
    kind: 'collection',
    items: { EVT: EventItemSchema },
    template: 'events.md',
    location: 'application/events.md',
  },
  decisions: {
    kind: 'collection',
    items: { DEC: DecisionItemSchema },
    template: 'decisions.md',
    location: 'application/decisions.md',
  },
} as const satisfies Record<string, DocumentType | CollectionType>;

export type SpecTypeName = keyof typeof SPEC_TYPES;

/** Prose-only templates (no schema): business-level text. */
export const PROSE_TEMPLATES = ['integrations.md', 'nfr.md'] as const;

/** Schemas exported as JSON Schema into .alterspec/schemas/. */
export const JSON_SCHEMAS: Record<string, z.ZodType> = {
  application: ApplicationSchema,
  module: ModuleSchema,
  capability: CapabilitySchema,
  screen: ScreenSchema,
  entity: EntitySchema,
  flow: FlowSchema,
  change: ChangeSchema,
  rule: RuleItemSchema,
  event: EventItemSchema,
  persona: PersonaItemSchema,
  role: RoleItemSchema,
  decision: DecisionItemSchema,
  'glossary-term': GlossaryItemSchema,
  experience: ExperienceScreenSchema,
  config: ConfigSchema,
};

export function toJsonSchema(name: string, schema: z.ZodType): object {
  return {
    title: `alterspec ${name}`,
    ...z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }),
  };
}

/** Item schema for a collection item, chosen by the ID prefix of its heading (`RULE-012 …` → RULE). */
export function itemSchemaFor(def: CollectionType, heading: string): z.ZodType | undefined {
  const items: Record<string, z.ZodType> = def.items;
  const prefix = heading.split('-')[0] ?? '';
  return items[prefix] ?? items['*'];
}
