import { z } from 'zod';
import { Status, Title, list } from './common.js';
import { CapabilityId, FlowId, RoleId } from './ids.js';

export const FlowSchema = z
  .object({
    id: FlowId,
    title: Title,
    status: Status,
    roles: list(RoleId),
    steps: z
      .array(
        z
          .object({
            step: z.number().int().min(1),
            capability: CapabilityId,
            role: RoleId.optional(),
            description: z.string().optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
  .superRefine((f, ctx) => {
    f.steps.forEach((s, i) => {
      if (s.step !== i + 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['steps', i, 'step'],
          message: `steps must be numbered 1..n; expected ${i + 1}`,
        });
      }
    });
  });

export type Flow = z.infer<typeof FlowSchema>;
