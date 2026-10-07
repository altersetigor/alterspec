import { z } from 'zod';

/** Design systems alterspec renders prototype variants with. `custom` variants are written with Claude. */
export const DesignBase = z.enum(['bootstrap', 'tabler', 'tailwind', 'custom']);
export type DesignBase = z.infer<typeof DesignBase>;

/** A YAML key with only commented-out children parses as null; treat it as absent. */
const orEmpty = <T extends z.ZodType>(t: T) => z.preprocess((v) => v ?? undefined, t);

const Color = z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'must be a colour like #1f6feb' });

/** `design/design.yaml`: how prototype variants look. Never part of the spec. */
export const DesignSchema = z
  .object({
    base: DesignBase,
    app: orEmpty(
      z
        .object({
          /** Shown in the header; defaults to the application title. */
          name: z.string().min(1).optional(),
          /** Path relative to design/, copied into each variant. */
          logo: z.string().min(1).optional(),
        })
        .strict()
        .default({}),
    ),
    shell: z.enum(['sidebar', 'topbar']).default('sidebar'),
    theme: orEmpty(
      z
        .object({
          primary: Color.optional(),
          secondary: Color.optional(),
          success: Color.optional(),
          danger: Color.optional(),
          warning: Color.optional(),
          /** A font-family list, e.g. "Inter, sans-serif". */
          font: z.string().min(1).optional(),
          /** Corner radius, e.g. 6px or 0.5rem. */
          radius: z
            .string()
            .regex(/^\d+(\.\d+)?(px|rem)$/, { message: 'must be a length like 6px or 0.5rem' })
            .optional(),
          dark: z.boolean().default(false),
        })
        .strict()
        .default({ dark: false }),
    ),
  })
  .strict();

export type Design = z.infer<typeof DesignSchema>;
