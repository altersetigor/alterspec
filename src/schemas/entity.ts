import { z } from 'zod';
import { StateName, Status, Title, list } from './common.js';
import { EntityId } from './ids.js';

/** Business kinds only — never storage or technical types. */
export const AttributeKind = z.enum([
  'text',
  'number',
  'amount',
  'date',
  'period',
  'yes_no',
  'choice',
  'reference',
  'document',
  'other',
]);

export const EntitySchema = z
  .object({
    id: EntityId,
    title: Title,
    status: Status,
    attributes: list(
      z
        .object({
          name: Title,
          kind: AttributeKind,
          required: z.boolean().default(false),
          description: z.string().optional(),
        })
        .strict(),
    ),
    relationships: list(
      z
        .object({
          entity: EntityId,
          cardinality: z.enum(['one', 'many']),
          description: z.string().optional(),
        })
        .strict(),
    ),
    states: list(StateName),
    initial_state: StateName.optional(),
    transitions: list(z.object({ from: StateName, to: StateName }).strict()),
  })
  .strict()
  .superRefine((e, ctx) => {
    const states = new Set(e.states);
    if (e.initial_state && !states.has(e.initial_state)) {
      ctx.addIssue({ code: 'custom', path: ['initial_state'], message: `unknown state ${e.initial_state}` });
    }
    e.transitions.forEach((t, i) => {
      for (const side of ['from', 'to'] as const) {
        if (!states.has(t[side])) {
          ctx.addIssue({
            code: 'custom',
            path: ['transitions', i, side],
            message: `unknown state ${t[side]}`,
          });
        }
      }
    });
  });

export type Entity = z.infer<typeof EntitySchema>;
