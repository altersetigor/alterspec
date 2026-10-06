import type { Bundle, BundleCapability } from '../bundle.js';
import type { AcceptanceCriterion } from '../extract.js';

/** Output files of a target, relative to its folder. */
export type TargetOutput = Map<string, string>;

export interface TargetContext {
  /** Date written into the output headers (YYYY-MM-DD). */
  date: string;
  version: string;
}

export const sentence = (s: string) => {
  const t = s.trim().replace(/\s+/g, ' ');
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : `${t}.`;
};
export const lowerFirst = (s: string) => (s && !/^[A-Z]{2}/.test(s) ? s[0]!.toLowerCase() + s.slice(1) : s);
export const join = (items: string[], word = 'and') =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} ${word} ${items[items.length - 1]}`;

export const rolesOf = (c: BundleCapability) => join(c.roles.map((r) => `the ${lowerFirst(r.title)}`));
export const goalOf = (c: BundleCapability) => c.text.userStory.goal ?? lowerFirst(c.title);
export const valueOf = (c: BundleCapability) => c.text.sections['Business value / problem'] ?? '';

/** All rule statements a capability applies, from the bundle. */
export const rulesOf = (b: Bundle, c: BundleCapability) =>
  c.rules.flatMap((r) => b.rules.filter((x) => x.id === r));

export const acLine = (ac: AcceptanceCriterion) => ({
  given: join(ac.given),
  when: join(ac.when),
  then: join(ac.then),
  and: ac.and,
});

export const sourceComment = (b: Bundle, ctx: TargetContext) =>
  `<!-- Exported by alterspec ${ctx.version} from ${b.scope.id} (${b.capabilities.map((c) => `${c.id} v${c.version}`).join(', ')}). Edit the source spec, not this file. -->`;

export const lifecycle = (e: Bundle['entities'][number]) =>
  e.transitions.length ? e.transitions.map((t) => `${t.from} → ${t.to}`).join(', ') : e.states.join(', ');
