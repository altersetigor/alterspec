import { parse } from 'yaml';

export interface CollectionItem {
  /** Heading text after `## `. */
  heading: string;
  /** Parsed yaml block, or undefined when the item has none. */
  data: unknown;
  /** 1-based line of the heading. */
  line: number;
}

const YAML_BLOCK = /```ya?ml\r?\n([\s\S]*?)```/;

/** Parse `## <ID> <Title>` items, each followed by a fenced yaml block. Text inside HTML comments is ignored. */
export function parseCollection(body: string): CollectionItem[] {
  const clean = body.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '));
  const lines = clean.split('\n');
  const starts: number[] = [];
  lines.forEach((l, i) => {
    if (/^## \S/.test(l)) starts.push(i);
  });
  return starts.map((start, n) => {
    const end = starts[n + 1] ?? lines.length;
    const section = lines.slice(start + 1, end).join('\n');
    const block = YAML_BLOCK.exec(section);
    return {
      heading: (lines[start] ?? '').slice(3).trim(),
      data: block ? (parse(block[1] ?? '') ?? {}) : undefined,
      line: start + 1,
    };
  });
}
