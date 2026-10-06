import { z } from 'zod';

export const Status = z.enum(['draft', 'refined', 'ready', 'approved', 'implemented']);
export type Status = z.infer<typeof Status>;

/** Permission scope: which data a role may act on. */
export const Scope = z.enum(['own', 'team', 'org', 'all']);
export type Scope = z.infer<typeof Scope>;

/** Entity operations: Create, Read, Update, Delete, Archive. */
export const Op = z.enum(['C', 'R', 'U', 'D', 'A']);

export const Title = z.string().trim().min(1, { message: 'must not be empty' });
export const Version = z.number().int().min(1);

/** Lifecycle state name, e.g. `draft`, `active`, `on_leave`. */
export const StateName = z.string().regex(/^[a-z][a-z0-9_]*$/, {
  message: 'must be a lowercase state name (letters, digits, underscore)',
});

/** A state transition written as `from->to`. */
export const TransitionRef = z.string().regex(/^[a-z][a-z0-9_]*->[a-z][a-z0-9_]*$/, {
  message: 'must be written as from->to, e.g. draft->active',
});

export const list = <T extends z.ZodType>(item: T) => z.array(item).default([]);
