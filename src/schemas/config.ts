import { z } from 'zod';

export const Severity = z.enum(['error', 'warn', 'off']);

export const ConfigSchema = z
  .object({
    version: z.string().min(1),
    language: z.literal('en'),
    lint: z
      .object({
        /** Per-rule severity overrides, keyed by linter rule name (Phase 2). */
        rules: z.record(z.string(), Severity).default({}),
        /** Words flagged by the tech-leak detector. */
        tech_terms: z.array(z.string().min(1)).default([]),
      })
      .strict()
      .default({ rules: {}, tech_terms: [] }),
  })
  .strict();

export type Config = z.infer<typeof ConfigSchema>;
