import { parse } from 'yaml';

export interface CollectionItem {
  /** Heading text after `## `. */
  heading: string;
  /** Parsed yaml block, or undefined when the item has none or it doesn't parse. */
  data: unknown;
  /** 1-based line of the heading (relative to the parsed text). */
  line: number;
  /** Raw text of the yaml block. */
  yamlSource?: string;
  /** 1-based line of the first line inside the yaml block. */
  yamlLine?: number;
  /** YAML parse error message, if the block doesn't parse. */
  error?: string;
}

/** Replace HTML comments with blanks, keeping line breaks so line numbers stay valid. */
export const blankComments = (text: string) =>
  text.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '));

/** Parse `## <ID> <Title>` items, each followed by a fenced yaml block. Text inside HTML comments is ignored. */
export function parseCollection(body: string): CollectionItem[] {
  const lines = blankComments(body).split('\n');
  const starts: number[] = [];
  let inFence = false;
  lines.forEach((l, i) => {
    if (l.startsWith('```')) inFence = !inFence;
    if (!inFence && /^## \S/.test(l)) starts.push(i);
  });
  return starts.map((start, n) => {
    const end = starts[n + 1] ?? lines.length;
    const item: CollectionItem = {
      heading: (lines[start] ?? '').slice(3).trim(),
      data: undefined,
      line: start + 1,
    };
    const open = lines.slice(start + 1, end).findIndex((l) => /^```ya?ml\s*$/.test(l));
    if (open === -1) return item;
    const from = start + 1 + open + 1;
    const close = lines.slice(from, end).findIndex((l) => l.startsWith('```'));
    const yamlSource = lines.slice(from, close === -1 ? end : from + close).join('\n');
    item.yamlSource = yamlSource;
    item.yamlLine = from + 1;
    try {
      item.data = parse(yamlSource) ?? {};
    } catch (err) {
      item.error = err instanceof Error ? err.message.split('\n')[0] : String(err);
    }
    return item;
  });
}

export interface ItemRange {
  heading: string;
  /** 1-based line of the heading. */
  line: number;
  /** Character offsets of the item: from its `## ` heading up to the next `# ` / `## ` heading or the end. */
  start: number;
  end: number;
  text: string;
}

/** Item sections of a collection file. Fenced blocks are respected; HTML comments are not special here. */
export function splitItems(text: string): ItemRange[] {
  const items: ItemRange[] = [];
  let offset = 0;
  let inFence = false;
  let current: Omit<ItemRange, 'end' | 'text'> | undefined;
  const close = (end: number) => {
    if (current) items.push({ ...current, end, text: text.slice(current.start, end) });
    current = undefined;
  };
  text.split('\n').forEach((line, i) => {
    if (line.startsWith('```')) inFence = !inFence;
    else if (!inFence && /^#{1,2} /.test(line)) {
      close(offset);
      if (line.startsWith('## ')) current = { heading: line.slice(3).trim(), line: i + 1, start: offset };
    }
    offset += line.length + 1;
  });
  close(text.length);
  return items;
}
