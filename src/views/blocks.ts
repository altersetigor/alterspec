import { sha256 } from '../install/hash.js';

export interface Block {
  name: string;
  /** Hash recorded in the start marker; undefined when the block was never generated. */
  hash: string | undefined;
  content: string;
  /** 1-based line of the start marker. */
  line: number;
  start: number;
  end: number;
}

const BLOCK =
  /<!-- GENERATED:start ([\w-]+)(?: hash=([0-9a-f]{12}))? -->\r?\n?([\s\S]*?)<!-- GENERATED:end -->/g;

export const blockHash = (content: string) => sha256(content).slice(0, 12);

export function findBlocks(text: string): Block[] {
  return [...text.matchAll(BLOCK)].map((m) => ({
    name: m[1] ?? '',
    hash: m[2],
    content: (m[3] ?? '').replace(/\r?\n$/, ''),
    line: text.slice(0, m.index).split('\n').length,
    start: m.index,
    end: m.index + m[0].length,
  }));
}

export function renderBlock(name: string, content: string): string {
  return `<!-- GENERATED:start ${name} hash=${blockHash(content)} -->\n${content}\n<!-- GENERATED:end -->`;
}

/** A block was edited by hand: it has a hash and the content no longer matches it. */
export const isEdited = (b: Block) => b.hash !== undefined && blockHash(b.content) !== b.hash;

/** Replace named blocks with new content. Returns the new text and the names that weren't found. */
export function replaceBlocks(
  text: string,
  desired: Record<string, string>,
): { text: string; missing: string[] } {
  const blocks = findBlocks(text);
  const found = new Set(blocks.map((b) => b.name));
  let out = '';
  let pos = 0;
  for (const b of blocks) {
    const content = desired[b.name];
    if (content === undefined) continue;
    out += text.slice(pos, b.start) + renderBlock(b.name, content);
    pos = b.end;
  }
  out += text.slice(pos);
  return { text: out, missing: Object.keys(desired).filter((n) => !found.has(n)) };
}

const FILE_HEADER = /^<!-- GENERATED:file hash=([0-9a-f]{12}) [^\n]*-->\n\n/;

/** Whole generated file (spec/_generated/*.md) with a hash header. */
export function renderGeneratedFile(content: string): string {
  return `<!-- GENERATED:file hash=${blockHash(content)} — written by \`alterspec views\`; do not edit -->\n\n${content}`;
}

/** True when a generated file's content no longer matches its header hash. */
export function isGeneratedFileEdited(text: string): boolean {
  const m = FILE_HEADER.exec(text);
  return m !== null && blockHash(text.slice(m[0].length)) !== m[1];
}
