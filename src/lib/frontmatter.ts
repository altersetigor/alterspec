import { parse } from 'yaml';

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export interface FrontMatterResult {
  data: unknown;
  body: string;
  hasFrontMatter: boolean;
}

export interface FrontMatterSplit {
  /** Raw YAML between the `---` lines, or undefined when there is no front-matter. */
  raw: string | undefined;
  body: string;
  /** 1-based line where the body starts. */
  bodyLine: number;
}

/** Split a markdown file into raw front-matter and body without parsing the YAML. */
export function splitFrontMatter(source: string): FrontMatterSplit {
  const m = FRONT_MATTER.exec(source);
  if (!m) return { raw: undefined, body: source, bodyLine: 1 };
  return {
    raw: m[1] ?? '',
    body: source.slice(m[0].length),
    bodyLine: m[0].split('\n').length - (m[0].endsWith('\n') ? 0 : 1),
  };
}

/** Split a markdown file into its YAML front-matter and body. */
export function parseFrontMatter(source: string): FrontMatterResult {
  const { raw, body } = splitFrontMatter(source);
  if (raw === undefined) return { data: undefined, body, hasFrontMatter: false };
  return { data: parse(raw) ?? {}, body, hasFrontMatter: true };
}
