import { parse } from 'yaml';
import type { SpecModel } from '../spec/model.js';

export const PATTERNS_FILE = 'experience/patterns.md';
export const DESIGN_SYSTEM_FILE = 'experience/design-system.md';

export interface Catalog {
  /** Archetype name → region names. */
  archetypes: Map<string, string[]>;
  components: Set<string>;
  /** Problems reading the catalogues. */
  problems: { file: string; message: string }[];
}

/** The first fenced yaml block holding `key`. */
function yamlBlock(text: string, key: string): unknown {
  for (const m of text.matchAll(/^```ya?ml\s*\n([\s\S]*?)^```/gm)) {
    try {
      const data = parse(m[1]!) as Record<string, unknown> | null;
      if (data && typeof data === 'object' && key in data) return data[key];
    } catch {
      // not this block
    }
  }
  return undefined;
}

/** Archetypes and their regions (patterns.md) and component names (design-system.md). */
export function readCatalog(model: SpecModel): Catalog {
  const content = new Map(model.raw.map((f) => [f.path, f.content]));
  const out: Catalog = { archetypes: new Map(), components: new Set(), problems: [] };

  const patterns = content.get(PATTERNS_FILE);
  const archetypes = patterns === undefined ? undefined : yamlBlock(patterns, 'archetypes');
  if (archetypes && typeof archetypes === 'object' && !Array.isArray(archetypes)) {
    for (const [name, def] of Object.entries(archetypes as Record<string, unknown>)) {
      const regions = (def as { regions?: unknown } | null)?.regions;
      out.archetypes.set(name, Array.isArray(regions) ? regions.map(String) : []);
    }
  } else {
    out.problems.push({
      file: PATTERNS_FILE,
      message: 'needs a yaml block with `archetypes:` (name → regions)',
    });
  }

  const ds = content.get(DESIGN_SYSTEM_FILE);
  const components = ds === undefined ? undefined : yamlBlock(ds, 'components');
  if (Array.isArray(components)) for (const c of components) out.components.add(String(c));
  else if (components && typeof components === 'object')
    for (const c of Object.keys(components)) out.components.add(c);
  else out.problems.push({ file: DESIGN_SYSTEM_FILE, message: 'needs a yaml block with `components:`' });
  return out;
}
