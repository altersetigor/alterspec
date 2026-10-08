import { z } from 'zod';
import { Title, list } from './common.js';
import { ChangeId, ID_REGEX, type IdKind } from './ids.js';

export const ChangeStatus = z.enum(['draft', 'in_review', 'approved', 'applied', 'rejected']);
export type ChangeStatus = z.infer<typeof ChangeStatus>;

/**
 * Key of an object a change touches: a spec ID, `term:<Term>` for a glossary term,
 * or `file:<path>` for a prose file such as application/nfr.md.
 */
export const ObjectKey = z
  .string()
  .refine(
    (v) =>
      /^term:\S.*$/.test(v) ||
      /^file:[\w./-]+\.md$/.test(v) ||
      /^file:experience\/mockups\/[\w./-]+$/.test(v) ||
      (Object.keys(ID_REGEX) as IdKind[]).some(
        (k) => k !== 'screenAction' && k !== 'acceptance' && ID_REGEX[k].test(v),
      ),
    { message: 'must be a spec ID, term:<Term> or file:<path>' },
  );

export const ChangeSchema = z
  .object({
    id: ChangeId,
    title: Title,
    status: ChangeStatus,
    created: z.iso.date(),
    applied: z.iso.date().optional(),
    /** Objects this change removes. */
    removes: list(ObjectKey),
    /**
     * Fingerprint of each touched object when the change started touching it (null = new object).
     * Written by the CLI; used to detect conflicts.
     */
    base: z.record(z.string(), z.string().nullable()).default({}),
    /** Fingerprint of the whole change when it was approved. Written by the CLI. */
    approved_hash: z.string().optional(),
  })
  .strict()
  .superRefine((c, ctx) => {
    for (const key of Object.keys(c.base)) {
      if (!ObjectKey.safeParse(key).success) {
        ctx.addIssue({ code: 'custom', path: ['base', key], message: `${key} is not a valid object key` });
      }
    }
  });

export type Change = z.infer<typeof ChangeSchema>;
