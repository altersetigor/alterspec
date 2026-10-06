import { splitItems } from '../lib/collection.js';

/**
 * Turn a collection template into an empty spec file: keep the headings and guidance,
 * drop the example `## ` items (each runs until the next `# ` or `## ` heading).
 */
export function stripItems(template: string): string {
  let out = '';
  let pos = 0;
  for (const item of splitItems(template)) {
    out += template.slice(pos, item.start);
    pos = item.end;
  }
  out += template.slice(pos);
  return out.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/** The example `## ` items of a collection template (the parts `stripItems` drops). */
export function extractItems(template: string): string[] {
  return splitItems(template).map((i) => i.text.trimEnd() + '\n');
}
