import { z } from 'zod';
import { Status, Title, Version, list } from './common.js';
import { AppId, ModuleId } from './ids.js';

export const ChannelKind = z.enum(['backoffice', 'customer', 'partner', 'mobile', 'web', 'api', 'other']);

export const ChannelSchema = z
  .object({
    name: Title,
    kind: ChannelKind,
    audience: z.string().optional(),
    /** The channel adapts to narrow screens (web kinds). */
    responsive: z.boolean().optional(),
    /** The channel keeps working without a connection (mobile). */
    offline: z.boolean().optional(),
  })
  .strict();

/** A language, currency or similar code: a short business label, not validated against a standard. */
const Code = z.string().trim().min(2, { message: 'must be at least two characters' });

export const Tenancy = z.enum(['single', 'multi']);
export const TenantData = z.enum(['shared', 'separate']);
export const TimeZones = z.enum(['single', 'per_user']);

/**
 * The product profile: the cross-cutting facts that decide how much there is to specify. Every field has a consumer
 * (a prompt, a lint rule or the mockup app); fields nobody reads are not added.
 */
export const ProfileSchema = z
  .object({
    tenancy: Tenancy,
    /** With `multi`: whether tenants see shared data or only their own. */
    tenant_data: TenantData.optional(),
    languages: z.array(Code).min(1),
    /** Required when there are several languages; must be one of them. */
    default_language: Code.optional(),
    /** With several languages: user-entered content is translated too, not only the interface. */
    localised_content: z.boolean().optional(),
    currencies: z.array(Code).min(1),
    /** Required when there are several currencies; must be one of them. */
    default_currency: Code.optional(),
    time_zones: TimeZones,
    /** The product's time zone, or the default one when `per_user`. A label only. */
    time_zone: z.string().trim().min(1).optional(),
  })
  .strict()
  .superRefine((p, ctx) => {
    requireDefault(ctx, p.languages, p.default_language, 'default_language', 'languages');
    requireDefault(ctx, p.currencies, p.default_currency, 'default_currency', 'currencies');
    if (p.tenancy === 'multi' && !p.tenant_data) {
      ctx.addIssue({
        code: 'custom',
        path: ['tenant_data'],
        message: 'a multi-tenant product says whether tenant data is shared or separate',
      });
    }
    if (p.tenancy === 'single' && p.tenant_data) {
      ctx.addIssue({ code: 'custom', path: ['tenant_data'], message: 'only for tenancy: multi' });
    }
    if (p.localised_content !== undefined && p.languages.length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['localised_content'],
        message: 'only for a product with several languages',
      });
    }
  });

/** With several values a default is mandatory and must be one of them. */
function requireDefault(
  ctx: z.RefinementCtx,
  values: string[],
  def: string | undefined,
  key: string,
  listKey: string,
) {
  if (values.length > 1 && def === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: [key],
      message: `${listKey} lists several values; pick the default (${values.join(', ')})`,
    });
  } else if (def !== undefined && !values.includes(def)) {
    ctx.addIssue({ code: 'custom', path: [key], message: `${def} is not one of ${listKey}` });
  }
}

export const ApplicationSchema = z
  .object({
    id: AppId,
    title: Title,
    status: Status,
    version: Version,
    channels: list(ChannelSchema),
    modules: list(ModuleId),
    profile: ProfileSchema.optional(),
  })
  .strict();

export type Application = z.infer<typeof ApplicationSchema>;
export type Channel = z.infer<typeof ChannelSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
