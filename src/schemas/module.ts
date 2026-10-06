import { z } from 'zod';
import { Status, Title, list } from './common.js';
import { ModuleId } from './ids.js';

export const ModuleSchema = z
  .object({
    id: ModuleId,
    title: Title,
    status: Status,
    depends_on: list(ModuleId),
  })
  .strict();

export type Module = z.infer<typeof ModuleSchema>;
