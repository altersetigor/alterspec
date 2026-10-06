import { z } from 'zod';
import { Op, Scope, Status, Title, TransitionRef, Version, list } from './common.js';
import {
  CapabilityId,
  EntityId,
  EventId,
  FlowId,
  ModuleId,
  RoleId,
  RuleId,
  ScreenId,
  codeInId,
  moduleCode,
} from './ids.js';

export const CapabilitySchema = z
  .object({
    id: CapabilityId,
    title: Title,
    module: ModuleId,
    status: Status,
    version: Version,
    roles: z.array(z.object({ role: RoleId, scope: Scope }).strict()).min(1),
    screens: list(ScreenId),
    entities: list(
      z
        .object({
          entity: EntityId,
          ops: z.array(Op).min(1),
          transitions: list(TransitionRef),
        })
        .strict(),
    ),
    rules: list(RuleId),
    events: z
      .object({ emits: list(EventId), consumes: list(EventId) })
      .strict()
      .default({ emits: [], consumes: [] }),
    depends_on: list(CapabilityId),
    flows: list(FlowId),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (codeInId(c.id) !== moduleCode(c.module)) {
      ctx.addIssue({
        code: 'custom',
        path: ['id'],
        message: `ID ${c.id} does not belong to module ${c.module}`,
      });
    }
  });

export type Capability = z.infer<typeof CapabilitySchema>;
