import { z } from 'zod';
import { Title, list } from './common.js';
import { AnyId, ChangeId } from './ids.js';

export const ChangeStatus = z.enum(['draft', 'in_review', 'approved', 'applied', 'rejected']);

export const ChangeSchema = z
  .object({
    id: ChangeId,
    title: Title,
    status: ChangeStatus,
    created: z.iso.date(),
    affects: z
      .object({ added: list(AnyId), modified: list(AnyId), removed: list(AnyId) })
      .strict()
      .default({ added: [], modified: [], removed: [] }),
  })
  .strict();

/** Front-matter of a single delta file inside changes/CHG-xxx/. */
export const DeltaSchema = z
  .object({
    change: ChangeId,
    op: z.enum(['added', 'modified', 'removed']),
    target: AnyId,
  })
  .strict();

export type Change = z.infer<typeof ChangeSchema>;
export type Delta = z.infer<typeof DeltaSchema>;
