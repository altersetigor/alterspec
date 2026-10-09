import { readFileSync } from 'node:fs';
import { blankComments } from '../lib/collection.js';
import { splitFrontMatter } from '../lib/frontmatter.js';
import { templatePath } from '../lib/templates.js';

export interface Section {
  heading: string;
  /** 1-based line of the heading, relative to the text parsed. */
  line: number;
  text: string;
}

/** `## ` sections of a markdown body (fenced blocks respected). */
export function sections(body: string): Section[] {
  const lines = body.split('\n');
  const out: Section[] = [];
  let inFence = false;
  lines.forEach((l, i) => {
    if (l.startsWith('```')) inFence = !inFence;
    if (!inFence && /^## \S/.test(l)) out.push({ heading: l.slice(3).trim(), line: i + 1, text: '' });
    else if (out.length) out[out.length - 1]!.text += l + '\n';
  });
  return out;
}

/** Lines that hold no content: blanks, bare list markers, empty bold labels, sub-headings. */
const EMPTYISH = /^\s*(?:(?:[-*]|\d+\.)\s*)?(?:\*\*[^*]+\*\*:?\s*)?$/;

/** Section text with comments, empty scaffolding lines and sub-headings removed, whitespace collapsed. */
export function normalizeSection(text: string): string {
  return blankComments(text)
    .split('\n')
    .filter((l) => !EMPTYISH.test(l) && !/^#{3,} /.test(l))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TEMPLATE_FOR = {
  capability: 'capability.md',
  screen: 'screen.md',
  entity: 'entity.md',
  experience: 'experience-screen.md',
} as const;
export type SectionedType = keyof typeof TEMPLATE_FOR;

const cache = new Map<string, Section[]>();

/**
 * The body sections a template defines, excluding sections that only hold a GENERATED block. With a project root,
 * the project's template override (`.alterspec/custom/templates/`) is used when there is one.
 */
export function templateSections(type: SectionedType, root?: string): Section[] {
  const path = templatePath(root, TEMPLATE_FOR[type]);
  let s = cache.get(path);
  if (!s) {
    const { body } = splitFrontMatter(readFileSync(path, 'utf8'));
    s = sections(body).filter((x) => !x.text.includes('GENERATED:start'));
    cache.set(path, s);
  }
  return s;
}

export interface SectionStatus {
  heading: string;
  /** 1-based line relative to the body, or undefined when the section is missing. */
  line: number | undefined;
  empty: boolean;
  missing: boolean;
}

/** Which template sections are missing or still empty (unchanged from the template scaffold) in a body. */
export function sectionStatus(type: SectionedType, body: string, root?: string): SectionStatus[] {
  const own = sections(body);
  return templateSections(type, root).map((t) => {
    const found = own.find((s) => s.heading.toLowerCase() === t.heading.toLowerCase());
    if (!found) return { heading: t.heading, line: undefined, empty: true, missing: true };
    const text = normalizeSection(found.text);
    return {
      heading: t.heading,
      line: found.line,
      empty: text === '' || text === normalizeSection(t.text),
      missing: false,
    };
  });
}
