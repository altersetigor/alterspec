import type {
  Application,
  Capability,
  Change,
  Delta,
  Entity,
  Flow,
  Module,
  Screen,
} from '../schemas/index.js';
import type { z } from 'zod';
import type {
  DecisionItemSchema,
  EventItemSchema,
  GlossaryItemSchema,
  PersonaItemSchema,
  RoleItemSchema,
  RuleItemSchema,
} from '../schemas/collections.js';
import type { SpecFile } from './files.js';

export type RuleItem = z.infer<typeof RuleItemSchema>;
export type EventItem = z.infer<typeof EventItemSchema>;
export type PersonaItem = z.infer<typeof PersonaItemSchema>;
export type RoleItem = z.infer<typeof RoleItemSchema>;
export type DecisionItem = z.infer<typeof DecisionItemSchema>;
export type GlossaryItem = z.infer<typeof GlossaryItemSchema>;

/** Kind of file, by location inside spec/. */
export type FileType =
  | 'application'
  | 'module'
  | 'capability'
  | 'screen'
  | 'entity'
  | 'flow'
  | 'change'
  | 'delta'
  | 'personas-roles'
  | 'glossary'
  | 'rules'
  | 'module-rules'
  | 'events'
  | 'decisions'
  | 'prose';

/** A validated spec object and where it lives. */
export interface Located<T> {
  id: string;
  data: T;
  /** Path relative to spec/. */
  file: string;
  /** 1-based line where the object starts (front-matter or collection heading). */
  line: number;
  /** File line of a value inside the object's YAML. */
  lineOf: (path: readonly PropertyKey[]) => number;
  /** Collection items only: the `## ` heading text. */
  heading?: string;
}

/** A spec document: front-matter object plus its markdown body. */
export interface LocatedDoc<T> extends Located<T> {
  body: string;
  /** 1-based file line where the body starts. */
  bodyLine: number;
}

export interface ClassifiedFile extends SpecFile {
  type: FileType | undefined;
  /** Path captures: module folder (`mod`), file stem (`name`), change folder (`change`). */
  parts: { mod?: string; name?: string; change?: string };
}

export interface SpecModel {
  /** Every file under spec/, including generated and ignored ones. */
  raw: SpecFile[];
  /** Spec files the loader read (ignored files excluded). */
  files: ClassifiedFile[];
  application?: LocatedDoc<Application>;
  modules: Map<string, LocatedDoc<Module>>;
  /** Folder names under modules/ (lower-case codes). */
  moduleDirs: Set<string>;
  capabilities: Map<string, LocatedDoc<Capability>>;
  screens: Map<string, LocatedDoc<Screen>>;
  entities: Map<string, LocatedDoc<Entity>>;
  flows: Map<string, LocatedDoc<Flow>>;
  changes: Map<string, LocatedDoc<Change>>;
  deltas: LocatedDoc<Delta>[];
  rules: Map<string, Located<RuleItem>>;
  events: Map<string, Located<EventItem>>;
  personas: Map<string, Located<PersonaItem>>;
  roles: Map<string, Located<RoleItem>>;
  decisions: Map<string, Located<DecisionItem>>;
  glossary: Located<GlossaryItem>[];
  /** Every definition of every ID, in file order (more than one means a duplicate). */
  definitions: Map<string, { file: string; line: number }[]>;
}

export function emptyModel(): SpecModel {
  return {
    raw: [],
    files: [],
    modules: new Map(),
    moduleDirs: new Set(),
    capabilities: new Map(),
    screens: new Map(),
    entities: new Map(),
    flows: new Map(),
    changes: new Map(),
    deltas: [],
    rules: new Map(),
    events: new Map(),
    personas: new Map(),
    roles: new Map(),
    decisions: new Map(),
    glossary: [],
    definitions: new Map(),
  };
}

/** Does an ID exist as a defined object of the right kind? */
export function exists(model: SpecModel, id: string): boolean {
  return (
    model.modules.has(id) ||
    model.capabilities.has(id) ||
    model.screens.has(id) ||
    model.entities.has(id) ||
    model.flows.has(id) ||
    model.changes.has(id) ||
    model.rules.has(id) ||
    model.events.has(id) ||
    model.personas.has(id) ||
    model.roles.has(id) ||
    model.decisions.has(id) ||
    (id === 'APP' && model.application !== undefined)
  );
}
