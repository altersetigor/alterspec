import { parse } from 'yaml';
import { sha256 } from '../install/hash.js';
import { splitItems, type ItemRange } from '../lib/collection.js';
import { splitFrontMatter } from '../lib/frontmatter.js';
import type { SpecFile } from '../spec/files.js';
import { classify, isIgnored } from '../spec/load.js';

/** One addressable piece of the spec: a document, a collection item or a prose file. */
export interface SpecObject {
  key: string;
  kind: 'doc' | 'item' | 'prose';
  /** Path relative to spec/. */
  file: string;
  /** The object's text: whole file for docs and prose, the item section for items. */
  text: string;
  /** 1-based line where the object starts. */
  line: number;
  /** For items: their range inside the file. */
  range?: ItemRange;
}

const COLLECTIONS = new Set(['personas-roles', 'glossary', 'rules', 'module-rules', 'events', 'decisions']);
const DOCUMENTS = new Set(['application', 'module', 'capability', 'screen', 'entity', 'flow', 'experience']);

/** GENERATED blocks reduced to bare markers, so regenerating views never changes a fingerprint. */
export const withoutGenerated = (text: string) =>
  text.replace(
    /<!-- GENERATED:start ([\w-]+)(?: hash=[0-9a-f]{12})? -->[\s\S]*?<!-- GENERATED:end -->/g,
    '<!-- GENERATED:start $1 -->\n<!-- GENERATED:end -->',
  );

export const fingerprint = (o: Pick<SpecObject, 'kind' | 'text'>) =>
  sha256(o.kind === 'item' ? o.text.trimEnd() : withoutGenerated(o.text)).slice(0, 16);

/** Key of a collection item: its yaml `id`, or `term:<Term>` for glossary items. */
export function itemKey(fileType: string | undefined, item: ItemRange): string {
  const block = /```ya?ml\r?\n([\s\S]*?)```/.exec(item.text.replace(/<!--[\s\S]*?-->/g, ''));
  let data: { id?: unknown; term?: unknown } | undefined;
  try {
    data = block ? (parse(block[1] ?? '') as typeof data) : undefined;
  } catch {
    data = undefined;
  }
  if (fileType === 'glossary') return `term:${typeof data?.term === 'string' ? data.term : item.heading}`;
  if (typeof data?.id === 'string') return data.id;
  return item.heading.split(/\s+/)[0] ?? item.heading;
}

function docKey(file: SpecFile): string {
  const { raw } = splitFrontMatter(file.content);
  try {
    const id = raw === undefined ? undefined : (parse(raw) as { id?: unknown } | null)?.id;
    if (typeof id === 'string') return id;
  } catch {
    // fall through
  }
  return `file:${file.path}`;
}

/** Every object of the main spec (changes and generated files excluded). */
/** Mockup files (HTML, CSS, scripts, images) are spec objects too: each file is one object, keyed by its path. */
export const isExperienceAsset = (path: string) =>
  path.startsWith('experience/mockups/') && !path.endsWith('.md');

export function specObjects(files: SpecFile[]): Map<string, SpecObject> {
  const out = new Map<string, SpecObject>();
  for (const f of files) {
    if ((isIgnored(f.path) && !isExperienceAsset(f.path)) || f.path.startsWith('changes/')) continue;
    const { type } = classify(f);
    if (type && COLLECTIONS.has(type)) {
      for (const item of splitItems(f.content)) {
        const key = itemKey(type, item);
        if (!out.has(key))
          out.set(key, { key, kind: 'item', file: f.path, text: item.text, line: item.line, range: item });
      }
    } else if (type && DOCUMENTS.has(type)) {
      const key = docKey(f);
      if (!out.has(key)) out.set(key, { key, kind: 'doc', file: f.path, text: f.content, line: 1 });
    } else {
      out.set(`file:${f.path}`, {
        key: `file:${f.path}`,
        kind: 'prose',
        file: f.path,
        text: f.content,
        line: 1,
      });
    }
  }
  return out;
}

export function fingerprints(files: SpecFile[]): Record<string, { hash: string; file: string }> {
  return Object.fromEntries(
    [...specObjects(files)]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, o]) => [k, { hash: fingerprint(o), file: o.file }]),
  );
}
