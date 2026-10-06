import { LineCounter, isNode, parseDocument, type Document } from 'yaml';

/** YAML text with its position in a file, so validation issues can point at a line. */
export class YamlSource {
  readonly data: unknown;
  readonly error: { message: string; line: number } | undefined;
  private readonly doc: Document;
  private readonly counter = new LineCounter();

  /** @param baseLine 1-based file line of the first YAML line. */
  constructor(
    raw: string,
    readonly baseLine: number,
  ) {
    this.doc = parseDocument(raw, { lineCounter: this.counter, prettyErrors: false });
    const err = this.doc.errors[0];
    if (err) {
      const line = this.counter.linePos(err.pos[0]).line;
      this.error = { message: err.message.split('\n')[0] ?? err.message, line: baseLine + line - 1 };
      this.data = undefined;
    } else {
      this.error = undefined;
      this.data = this.doc.toJS() ?? {};
    }
  }

  /** File line of the value at `path`, falling back to the closest existing parent. */
  lineOf(path: readonly PropertyKey[]): number {
    for (let n = path.length; n >= 0; n--) {
      const node = this.doc.getIn(path.slice(0, n) as unknown[], true);
      if (isNode(node) && node.range) {
        return this.baseLine + this.counter.linePos(node.range[0]).line - 1;
      }
      if (n > 0) {
        // the key itself exists even when its value is empty
        const parent = this.doc.getIn(path.slice(0, n - 1) as unknown[], true);
        const pair = isNode(parent) && 'items' in parent ? (parent.items as unknown[]) : undefined;
        const keyNode = pair
          ?.map((p) => (p as { key?: unknown }).key)
          .find((k) => isNode(k) && (k as { value?: unknown }).value === path[n - 1]);
        if (isNode(keyNode) && keyNode.range)
          return this.baseLine + this.counter.linePos(keyNode.range[0]).line - 1;
      }
    }
    return this.baseLine;
  }
}
