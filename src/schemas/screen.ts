import { z } from 'zod';
import { Scope, Status, Title, list } from './common.js';
import {
  CapabilityId,
  EntityId,
  ModuleId,
  RoleId,
  ScreenActionId,
  ScreenId,
  codeInId,
  moduleCode,
} from './ids.js';

export const MockupSchema = z
  .object({
    type: z.enum(['figma', 'image', 'html', 'other']),
    ref: z.string().min(1),
    note: z.string().optional(),
  })
  .strict();

/** How a screen presents one entity's data: many records, one record, or one record being entered. */
export const FieldMode = z.enum(['list', 'view', 'edit']);

export const ScreenFieldsSchema = z
  .object({
    entity: EntityId,
    /** Entity attribute names, exactly as the entity lists them. */
    attributes: z.array(Title).min(1),
    mode: FieldMode,
    /** Narrows which screen roles see this group. Empty: every screen role. */
    roles: list(RoleId),
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
    fields: list(ScreenFieldsSchema),
    actions: list(
      z
        .object({
          id: ScreenActionId,
          label: Title,
          capability: CapabilityId,
          /** Narrows who sees the action. Empty: the capability's roles that are screen roles. */
          roles: list(RoleId),
        })
        .strict(),
    ),
    mockups: list(MockupSchema),
    /** Channel names from application.md the screen is for. Empty: every channel. */
    channels: list(z.string().min(1)),
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
