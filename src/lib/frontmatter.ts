import { parse } from 'yaml';

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export interface FrontMatterResult {
  data: unknown;
  body: string;
  hasFrontMatter: boolean;
}

/** Split a markdown file into its YAML front-matter and body. */
export function parseFrontMatter(source: string): FrontMatterResult {
  const m = FRONT_MATTER.exec(source);
  if (!m) return { data: undefined, body: source, hasFrontMatter: false };
  return { data: parse(m[1] ?? '') ?? {}, body: source.slice(m[0].length), hasFrontMatter: true };
}
