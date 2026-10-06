import { z } from 'zod';
import { Status, Title, list } from './common.js';
import { CapabilityId, DecisionId, EntityId, EventId, PersonaId, RoleId, RuleId } from './ids.js';

/**
 * Collection files (rules, events, personas & roles, decisions, glossary) hold many items.
 * Each item is a `## <ID> <Title>` heading followed by a fenced yaml block validated here.
 */

export const RuleItemSchema = z
  .object({
    id: RuleId,
    title: Title,
    status: Status,
    entities: list(EntityId),
  })
  .strict();

export const EventItemSchema = z
  .object({
    id: EventId,
    title: Title,
    /** Emitted or consumed outside the product (an external party). */
    external: z.boolean().default(false),
    entities: list(EntityId),
  })
  .strict();

export const PersonaItemSchema = z
  .object({
    id: PersonaId,
    title: Title,
    roles: list(RoleId),
  })
  .strict();

export const RoleItemSchema = z
  .object({
    id: RoleId,
    title: Title,
  })
  .strict();

export const DecisionItemSchema = z
  .object({
    id: DecisionId,
    title: Title,
    kind: z.enum(['decision', 'open_question', 'assumption']),
    status: z.enum(['open', 'decided', 'superseded']),
    date: z.iso.date().optional(),
    supersedes: DecisionId.optional(),
    affects: list(z.union([CapabilityId, EntityId, RuleId])),
  })
  .strict();

export const GlossaryItemSchema = z
  .object({
    term: Title,
    forbidden: list(z.string().min(1)),
  })
  .strict();
