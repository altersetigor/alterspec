import { z } from 'zod';
import { Status, Title, Version, list } from './common.js';
import { AppId, ModuleId } from './ids.js';

export const ChannelSchema = z
  .object({
    name: Title,
    kind: z.enum(['backoffice', 'customer', 'partner', 'mobile', 'web', 'api', 'other']),
    audience: z.string().optional(),
  })
  .strict();

export const ApplicationSchema = z
  .object({
    id: AppId,
    title: Title,
    status: Status,
    version: Version,
    channels: list(ChannelSchema),
    modules: list(ModuleId),
  })
  .strict();

export type Application = z.infer<typeof ApplicationSchema>;
