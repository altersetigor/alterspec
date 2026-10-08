/**
 * A small, dependency-free reader for the parts of a mockup the checks need: the opening tag that carries a
 * `data-src`, its attributes, and the visible text inside the element. Mockups are hand-written HTML, so this
 * reads tags, not a full DOM; unusual markup is reported rather than guessed at.
 */

const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);

const decode = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

export interface Tag {
  name: string;
  attrs: Record<string, string>;
  /** Offset of `<` and of the character after `>`. */
  start: number;
  end: number;
}

const TAG = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/g;
const ATTR = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

/** Every opening tag, with decoded attributes. Comments and script/style contents are skipped. */
export function tags(html: string): Tag[] {
  const clean = blank(html);
  const out: Tag[] = [];
  for (const m of clean.matchAll(TAG)) {
    const attrs: Record<string, string> = {};
    for (const a of (m[2] ?? '').matchAll(ATTR))
      attrs[a[1]!.toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? '');
    out.push({ name: m[1]!.toLowerCase(), attrs, start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/** Comments and the contents of script/style replaced by spaces, so offsets stay the same. */
function blank(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length))
    .replace(
      /(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi,
      (_m, open: string, _n, body: string, close: string) => open + ' '.repeat(body.length) + close,
    );
}

/** Offset just after the element's closing tag, or undefined if it can't be found. */
export function elementEnd(html: string, tag: Tag): { inner: number; end: number } | undefined {
  if (VOID.has(tag.name)) return { inner: tag.end, end: tag.end };
  const clean = blank(html);
  const re = new RegExp(`<(/?)${tag.name}\\b[^>]*?(/?)>`, 'gi');
  re.lastIndex = tag.end;
  let depth = 1;
  for (let m = re.exec(clean); m; m = re.exec(clean)) {
    if (m[2]) continue;
    depth += m[1] ? -1 : 1;
    if (depth === 0) return { inner: m.index, end: m.index + m[0].length };
  }
  return undefined;
}

/** The text inside an element (tags removed, whitespace collapsed), or undefined if its end can't be found. */
export function elementText(html: string, tag: Tag): string | undefined {
  if (VOID.has(tag.name))
    return tag.attrs['value'] ?? tag.attrs['placeholder'] ?? tag.attrs['aria-label'] ?? '';
  const range = elementEnd(html, tag);
  if (!range) return undefined;
  const inner = blank(html).slice(tag.end, range.inner);
  const text = inner
    .replace(/<[^>]*\baria-label="([^"]*)"[^>]*>/g, ' $1 ')
    .replace(/<input\b[^>]*\bvalue="([^"]*)"[^>]*>/g, ' $1 ')
    .replace(/<[^>]+>/g, ' ');
  return decode(text).replace(/\s+/g, ' ').trim();
}

export const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
