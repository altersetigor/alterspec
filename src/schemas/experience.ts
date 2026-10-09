import { z } from 'zod';
import { Status, list } from './common.js';
import { ExperienceId, RoleId, ScreenId } from './ids.js';

/** Names from the design system and pattern catalogues: lower case, words joined with `-`. */
export const UxName = z.string().regex(/^[a-z][a-z0-9-]*$/, { message: 'must be lower-case-with-dashes' });

export const ExperienceElementSchema = z
  .object({
    /** The `data-src` of a business element on the screen (see the generated wireframe's manifest). */
    src: z.string().min(1),
    region: UxName,
    component: UxName,
    /** The text people see: a heading, a field label, a button caption, a message. */
    label: z.string().min(1),
    /** For roles that may not use it: hide it, or show it disabled with a reason. */
    unavailable: z.enum(['hidden', 'disabled']).optional(),
    reason: z.string().min(1).optional(),
  })
  .strict();

export const ExperienceStateSchema = z
  .object({
    /** `default`, a business state (`empty`, `no-permission`, `validation`) or a design state such as `loading`. */
    id: UxName,
    /** The demo user's role the state is shown as. */
    as: RoleId.optional(),
    note: z.string().optional(),
  })
  .strict();

/**
 * The experience (UX) contract of one business screen: archetype, regions, components, labels and states.
 * UI-technical by design; lives in spec/experience/screens/. Its mockup is experience/mockups/<SCR>.html.
 */
export const ExperienceScreenSchema = z
  .object({
    id: ExperienceId,
    screen: ScreenId,
    status: Status,
    archetype: UxName,
    /** Fingerprint of the generated wireframe page this screen was aligned with. Written by the CLI. */
    dry: z.string().optional(),
    /** Fingerprint of this screen and its mockup at the last clean parity review. Written by the CLI. */
    reviewed: z.string().optional(),
    /** Fingerprint of the mockup page as the CLI last rendered it; `rebuild` replaces only an untouched page. */
    page: z.string().optional(),
    elements: list(ExperienceElementSchema),
    states: list(ExperienceStateSchema),
  })
  .strict()
  .superRefine((x, ctx) => {
    if (x.id !== `UX-${x.screen}`)
      ctx.addIssue({ code: 'custom', path: ['id'], message: `ID must be UX-${x.screen}` });
    x.elements.forEach((e, i) => {
      if (e.reason && e.unavailable !== 'disabled')
        ctx.addIssue({
          code: 'custom',
          path: ['elements', i, 'reason'],
          message: 'reason is only for elements shown disabled',
        });
    });
    const seen = new Set<string>();
    x.states.forEach((s, i) => {
      if (seen.has(s.id))
        ctx.addIssue({ code: 'custom', path: ['states', i, 'id'], message: `duplicate state ${s.id}` });
      seen.add(s.id);
    });
  });

export type ExperienceScreen = z.infer<typeof ExperienceScreenSchema>;
