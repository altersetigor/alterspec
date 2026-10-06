import { z } from 'zod';
import { Scope, Status, Title, list } from './common.js';
import { CapabilityId, ModuleId, RoleId, ScreenActionId, ScreenId, codeInId, moduleCode } from './ids.js';

export const MockupSchema = z
  .object({
    type: z.enum(['figma', 'image', 'html', 'other']),
    ref: z.string().min(1),
    note: z.string().optional(),
  })
  .strict();

export const ScreenSchema = z
  .object({
    id: ScreenId,
    title: Title,
    /** Owning module. Shared screens (SCR-GLB-*) belong to MOD-GLB. */
    module: ModuleId,
    status: Status,
    roles: list(z.object({ role: RoleId, scope: Scope.optional() }).strict()),
    entry_points: list(z.string().min(1)),
    actions: list(z.object({ id: ScreenActionId, label: Title, capability: CapabilityId }).strict()),
    mockups: list(MockupSchema),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (codeInId(s.id) !== moduleCode(s.module)) {
      ctx.addIssue({
        code: 'custom',
        path: ['id'],
        message: `ID ${s.id} does not belong to module ${s.module}`,
      });
    }
    const seen = new Set<string>();
    s.actions.forEach((a, i) => {
      if (seen.has(a.id))
        ctx.addIssue({ code: 'custom', path: ['actions', i, 'id'], message: `duplicate action ${a.id}` });
      seen.add(a.id);
    });
  });

export type Screen = z.infer<typeof ScreenSchema>;
