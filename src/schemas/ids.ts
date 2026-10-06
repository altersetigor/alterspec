import { z } from 'zod';

/**
 * Single source of truth for alterspec ID formats.
 * Module codes are 2–6 uppercase letters (e.g. HR, INV). `GLB` is reserved for the global module.
 */
const CODE = '[A-Z]{2,6}';
const NAME = '[A-Z0-9]+(?:-[A-Z0-9]+)*';

export const ID_PATTERNS = {
  app: '^APP$',
  module: `^MOD-${CODE}$`,
  capability: `^CAP-${CODE}-\\d{3}$`,
  screen: `^SCR-${CODE}-\\d{2}$`,
  role: `^ROLE-${NAME}$`,
  persona: `^PER-${NAME}$`,
  entity: `^ENT-${NAME}$`,
  rule: `^RULE-(?:${CODE}-)?\\d{3}$`,
  flow: '^FLOW-\\d{3}$',
  event: `^EVT-${NAME}$`,
  decision: '^DEC-\\d{3}$',
  change: '^CHG-\\d{3}$',
  acceptance: `^CAP-${CODE}-\\d{3}-AC-\\d{2}$`,
  screenAction: '^A\\d{2}$',
} as const;

export type IdKind = keyof typeof ID_PATTERNS;

export const ID_REGEX: Record<IdKind, RegExp> = Object.fromEntries(
  Object.entries(ID_PATTERNS).map(([k, p]) => [k, new RegExp(p)]),
) as Record<IdKind, RegExp>;

const idOf = (kind: IdKind, label: string) =>
  z.string().regex(ID_REGEX[kind], { message: `must be a ${label} ID matching ${ID_PATTERNS[kind]}` });

export const AppId = idOf('app', 'application');
export const ModuleId = idOf('module', 'module');
export const CapabilityId = idOf('capability', 'capability');
export const ScreenId = idOf('screen', 'screen');
export const RoleId = idOf('role', 'role');
export const PersonaId = idOf('persona', 'persona');
export const EntityId = idOf('entity', 'entity');
export const RuleId = idOf('rule', 'rule');
export const FlowId = idOf('flow', 'flow');
export const EventId = idOf('event', 'event');
export const DecisionId = idOf('decision', 'decision');
export const ChangeId = idOf('change', 'change');
export const AcceptanceId = idOf('acceptance', 'acceptance criterion');
export const ScreenActionId = idOf('screenAction', 'screen action');

/** Any spec object ID (used where several kinds are allowed, e.g. change deltas). */
export const AnyId = z
  .string()
  .refine(
    (v) => (Object.keys(ID_REGEX) as IdKind[]).some((k) => k !== 'screenAction' && ID_REGEX[k].test(v)),
    { message: 'must be a valid alterspec ID' },
  );

/** Module code from a module ID: MOD-HR → HR. */
export const moduleCode = (moduleId: string): string => moduleId.replace(/^MOD-/, '');

/** Module code embedded in a CAP/SCR/module-RULE ID: CAP-HR-004 → HR. */
export const codeInId = (id: string): string | undefined => /^(?:CAP|SCR|RULE)-([A-Z]{2,6})-/.exec(id)?.[1];

/** Detect the kind of an ID, or undefined. */
export function idKind(id: string): IdKind | undefined {
  return (Object.keys(ID_REGEX) as IdKind[]).find((k) => ID_REGEX[k].test(id));
}
