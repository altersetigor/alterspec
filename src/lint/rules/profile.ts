import type { ProfileDimension } from '../../schemas/config.js';
import { sections } from '../../spec/sections.js';
import { findTerms, termMatcher } from '../text.js';
import type { LintRule, RawFinding } from '../types.js';

const PROSE_TYPES = new Set(['capability', 'screen', 'entity', 'module', 'flow', 'rules', 'module-rules']);

export const profileMissing: LintRule = {
  name: 'profile-missing',
  severity: 'warn',
  description:
    'application.md has a product profile (tenancy, languages, currencies, time zones) so the spec effort can be narrowed.',
  check: ({ model }) => {
    const app = model.application;
    if (!app || app.data.profile) return [];
    return [
      {
        file: app.file,
        line: app.line,
        id: 'APP',
        message: 'no product profile; run /alterspec-init or `alterspec profile set` to record it',
      },
    ];
  },
};

export const screenChannel: LintRule = {
  name: 'screen-channel',
  severity: 'error',
  description: "A screen's channels are channels application.md lists.",
  check: ({ model }) => {
    const known = new Set((model.application?.data.channels ?? []).map((c) => c.name.toLowerCase()));
    const out: RawFinding[] = [];
    for (const s of model.screens.values()) {
      s.data.channels.forEach((name, i) => {
        if (known.has(name.toLowerCase())) return;
        out.push({
          file: s.file,
          line: s.lineOf(['channels', i]),
          id: s.id,
          message: `channel "${name}" is not in application.md; add it with \`alterspec new channel\` or fix the name`,
        });
      });
    }
    return out;
  },
};

/** The profile dimensions a product has ruled out, with the words that betray content for them. */
function excluded(profile: NonNullable<ReturnType<typeof profileOf>>): [ProfileDimension, string][] {
  const out: [ProfileDimension, string][] = [];
  if (profile.currencies.length === 1) out.push(['currency', 'one currency']);
  if (profile.languages.length === 1) out.push(['language', 'one language']);
  if (profile.tenancy === 'single') out.push(['tenant', 'single tenancy']);
  if (profile.time_zones === 'single') out.push(['time_zone', 'one time zone']);
  return out;
}
const profileOf = (model: { application?: { data: { profile?: unknown } } }) =>
  model.application?.data.profile as
    { currencies: string[]; languages: string[]; tenancy: string; time_zones: string } | undefined;

export const profileExcluded: LintRule = {
  name: 'profile-excluded',
  severity: 'warn',
  description:
    'Spec prose stays inside the product profile: no currency conversion, translation, tenants or time zones when the profile rules them out (config: lint.profile_terms).',
  check: ({ model, config }) => {
    const profile = profileOf(model);
    if (!profile) return [];
    const out: RawFinding[] = [];
    for (const [dimension, says] of excluded(profile)) {
      for (const f of model.files) {
        if (!f.type || !PROSE_TYPES.has(f.type)) continue;
        for (const term of config.lint.profile_terms[dimension]) {
          for (const h of findTerms(f.content, term)) {
            out.push({
              file: f.path,
              line: h.line,
              message: `"${h.match}" but the profile says ${says}; drop it, or raise an open question to change the profile`,
            });
          }
        }
      }
    }
    return out;
  },
};

const REFINED = new Set(['refined', 'ready', 'approved', 'implemented']);
const VISIBILITY = 'permissions and data visibility';

export const tenantVisibility: LintRule = {
  name: 'tenant-visibility',
  severity: 'warn',
  description:
    'In a multi-tenant product, every refined capability says what tenants see under "Permissions and data visibility".',
  check: ({ model, config }) => {
    const profile = profileOf(model);
    if (profile?.tenancy !== 'multi') return [];
    const terms = config.lint.profile_terms.tenant.map(termMatcher);
    const out: RawFinding[] = [];
    for (const c of model.capabilities.values()) {
      if (!REFINED.has(c.data.status)) continue;
      const section = sections(c.body).find((s) => s.heading.toLowerCase() === VISIBILITY);
      if (section && terms.some((re) => re.test(section.text))) continue;
      out.push({
        file: c.file,
        line: section ? c.bodyLine - 1 + section.line : c.line,
        id: c.id,
        message: `${c.id} is ${c.data.status} in a multi-tenant product but "Permissions and data visibility" doesn't say what tenants see`,
      });
    }
    return out;
  },
};
