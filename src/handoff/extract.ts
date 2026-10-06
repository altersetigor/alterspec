import { blankComments } from '../lib/collection.js';
import { sections } from '../spec/sections.js';

export interface AcceptanceCriterion {
  id: string;
  given: string[];
  when: string[];
  then: string[];
  and: string[];
  covers?: string;
}

export interface UserStory {
  raw: string;
  persona?: string;
  goal?: string;
  benefit?: string;
}

export interface CapabilityText {
  userStory: UserStory;
  /** Cleaned text per `## ` section. */
  sections: Record<string, string>;
  mainFlow: string[];
  exceptions: string[];
  outOfScope: string[];
  openQuestions: string[];
  acceptance: AcceptanceCriterion[];
}

/** Section text without comments or GENERATED blocks, trimmed. "None." counts as empty. */
export function cleanText(text: string): string {
  const t = blankComments(text.replace(/<!-- GENERATED:start[\s\S]*?<!-- GENERATED:end -->/g, ''))
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return /^none\.?$/i.test(t) ? '' : t;
}

/** Items of a markdown list (`- x` or `1. x`); plain paragraphs count as one item each. */
export function listItems(text: string): string[] {
  const out: string[] = [];
  for (const line of cleanText(text).split('\n')) {
    const m = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(line);
    if (m?.[1]?.trim()) out.push(m[1].trim());
    else if (line.trim() && !/^#/.test(line.trim())) {
      if (out.length && /^\s{2,}/.test(line)) out[out.length - 1] += ` ${line.trim()}`;
      else out.push(line.trim());
    }
  }
  return out.filter((x) => !/^none\.?$/i.test(x));
}

/** First paragraph of a text, on one line. */
export const firstParagraph = (text: string) =>
  (cleanText(text).split(/\n\s*\n/)[0] ?? '').replace(/\s+/g, ' ').trim();

export function parseUserStory(text: string): UserStory {
  const raw = firstParagraph(text);
  const m = /^As an? (.+?),\s*I want (?:to )?(.+?),?\s+so that (.+?)\.?$/i.exec(raw);
  return m ? { raw, persona: m[1]?.trim(), goal: m[2]?.trim(), benefit: m[3]?.trim() } : { raw };
}

const LABEL = /^\s*[-*]?\s*\*\*(Given|When|Then|And|Covers):?\*\*:?\s*(.*)$/i;

export function parseAcceptance(sectionText: string): AcceptanceCriterion[] {
  return blankComments(sectionText)
    .split(/^### /m)
    .slice(1)
    .map((chunk) => {
      const [head = '', ...lines] = chunk.split('\n');
      const ac: AcceptanceCriterion = {
        id: head.trim().split(/\s+/)[0] ?? '',
        given: [],
        when: [],
        then: [],
        and: [],
      };
      let last: 'given' | 'when' | 'then' | 'and' | undefined;
      for (const line of lines) {
        const m = LABEL.exec(line);
        if (m) {
          const label = (m[1] ?? '').toLowerCase();
          const value = (m[2] ?? '').trim();
          if (label === 'covers') ac.covers = value || undefined;
          else if (value) {
            last = label as typeof last;
            ac[last!].push(value);
          }
        } else if (last && line.trim() && /^\s{2,}/.test(line)) {
          const list = ac[last];
          list[list.length - 1] += ` ${line.trim()}`;
        }
      }
      return ac;
    });
}

export function extractCapability(body: string): CapabilityText {
  const secs = Object.fromEntries(sections(body).map((s) => [s.heading.toLowerCase(), s.text]));
  const get = (h: string) => secs[h.toLowerCase()] ?? '';
  const cleaned = Object.fromEntries(sections(body).map((s) => [s.heading, cleanText(s.text)]));
  return {
    userStory: parseUserStory(get('Summary and user story')),
    sections: cleaned,
    mainFlow: listItems(get('Main flow')),
    exceptions: listItems(get('Alternative and exception flows')),
    outOfScope: listItems(get('Out of scope')),
    openQuestions: listItems(get('Open questions')),
    acceptance: parseAcceptance(get('Acceptance criteria')),
  };
}

/** Prose of a collection item: everything after the heading and yaml block. */
export function itemProse(itemText: string): string {
  const lines = itemText.split('\n').slice(1).join('\n');
  return cleanText(lines.replace(/```ya?ml[\s\S]*?```/, ''));
}
