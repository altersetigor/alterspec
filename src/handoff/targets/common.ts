import type { Bundle } from '../bundle.js';

/** Output files of a target, relative to its folder. */
export type TargetOutput = Map<string, string>;

export interface TargetContext {
  /** Date written into the output headers (YYYY-MM-DD). */
  date: string;
  version: string;
}

export const sourceComment = (b: Bundle, ctx: TargetContext) =>
  `<!-- Exported by alterspec ${ctx.version} from ${b.scope.id} (${b.capabilities.map((c) => `${c.id} v${c.version}`).join(', ')}). Edit the source spec, not this file. -->`;

export const lifecycle = (e: Bundle['entities'][number]) =>
  e.transitions.length ? e.transitions.map((t) => `${t.from} → ${t.to}`).join(', ') : e.states.join(', ');
