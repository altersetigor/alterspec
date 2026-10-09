import { readFileSync, writeFileSync } from 'node:fs';
import { isScalar, isSeq, parseDocument, visit, type Document } from 'yaml';
import { splitFrontMatter } from './frontmatter.js';

/** Load a markdown file's front-matter as a yaml document (comments and layout kept) and write it back. */
function editFrontMatter(file: string, edit: (doc: Document) => void) {
  const src = readFileSync(file, 'utf8');
  const split = splitFrontMatter(src);
  if (split.raw === undefined) throw new Error(`${file} has no front-matter`);
  const doc = parseDocument(split.raw);
  edit(doc);
  writeFileSync(file, `---\n${doc.toString({ flowCollectionPadding: false }).trimEnd()}\n---\n${split.body}`);
}

/** Append a value to a top-level front-matter list, unless it is already there. */
export function addToList(file: string, key: string, value: unknown, sameAs?: (item: unknown) => boolean) {
  editFrontMatter(file, (doc) => {
    const list = doc.get(key, true);
    if (isSeq(list)) {
      const same = sameAs ?? ((item) => item === value);
      if (list.items.some((i) => same(doc.createNode(i).toJSON()))) return;
      list.flow = false;
    }
    doc.addIn([key], value);
  });
}

/** Set a value at a front-matter path, creating the path. */
export function setPath(file: string, path: (string | number)[], value: unknown) {
  editFrontMatter(file, (doc) => {
    const node = doc.createNode(value);
    // Short lists of plain values read best inline: `languages: [en, de]`.
    visit(node, { Seq: (_, seq) => void (seq.flow = seq.items.every((i) => isScalar(i))) });
    doc.setIn(path, node);
  });
}

/** The 1-based line of a top-level front-matter key, or 1 when it isn't there. */
export function lineOfKey(file: string, key: string): number {
  const { raw } = splitFrontMatter(readFileSync(file, 'utf8'));
  const at = (raw ?? '').split('\n').findIndex((l) => l.startsWith(`${key}:`));
  return at === -1 ? 1 : at + 2;
}
