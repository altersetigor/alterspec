/** Blank every character except line breaks, so line numbers survive. */
const blank = (s: string) => s.replace(/[^\n]/g, ' ');

/**
 * The prose of a markdown file, line by line: front-matter, fenced blocks, HTML comments,
 * generated blocks, inline code and link targets are blanked out.
 */
export function proseLines(content: string): string[] {
  let text = content.replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?=\r?\n|$)/, blank);
  text = text.replace(/<!-- GENERATED:start[\s\S]*?<!-- GENERATED:end -->/g, blank);
  text = text.replace(/<!-- GENERATED:file[\s\S]*$/g, blank);
  text = text.replace(/<!--[\s\S]*?-->/g, blank);
  text = text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, blank);
  text = text.replace(/`[^`\n]*`/g, blank);
  text = text.replace(/\]\([^)\n]*\)/g, (m) => ']' + blank(m.slice(1)));
  return text.split('\n');
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Whole-word matcher. All-caps terms (REST, SQL) match case-sensitively so ordinary words
 * ("rest period") aren't flagged; other terms match case-insensitively.
 */
export function termMatcher(term: string): RegExp {
  const caseSensitive = /[A-Z]/.test(term) && term === term.toUpperCase();
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escape(term)}(?![\\p{L}\\p{N}_])`, caseSensitive ? 'gu' : 'giu');
}

export interface TermHit {
  line: number;
  match: string;
}

export function findTerms(content: string, term: string): TermHit[] {
  const re = termMatcher(term);
  return proseLines(content).flatMap((l, i) =>
    [...l.matchAll(re)].map((m) => ({ line: i + 1, match: m[0] })),
  );
}
