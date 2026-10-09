import { z } from 'zod';

export const Severity = z.enum(['error', 'warn', 'off']);

const Terms = z.array(z.string().min(1)).default([]);
export const ProfileTermsSchema = z
  .object({ currency: Terms, language: Terms, tenant: Terms, time_zone: Terms })
  .strict();
export type ProfileDimension = keyof z.infer<typeof ProfileTermsSchema>;

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
        /** Words the profile-excluded rule flags when the product profile rules a dimension out. */
        profile_terms: ProfileTermsSchema.default({ currency: [], language: [], tenant: [], time_zone: [] }),
      })
      .strict()
      .default({
        rules: {},
        tech_terms: [],
        profile_terms: { currency: [], language: [], tenant: [], time_zone: [] },
      }),
  })
  .strict();

export type Config = z.infer<typeof ConfigSchema>;
