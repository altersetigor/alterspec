import { readCatalog } from '../../experience/catalog.js';
import { elementText, normalize, tags, visibleText, type Tag } from '../../experience/html.js';
import {
  contentOf,
  dryHash,
  dryPage,
  hasExperience,
  mockupPath,
  narrowedRoles,
  reviewHash,
  uxElements,
  type ExperienceDoc,
} from '../../experience/index.js';
import type { ScreenPage } from '../../prototype/model.js';
import type { SpecModel } from '../../spec/model.js';
import type { LintRule, RawFinding } from '../types.js';

const READY = new Set(['ready', 'approved', 'implemented']);

/** Each experience screen with its business page and mockup; screens whose business screen is unknown are skipped. */
function each(model: SpecModel): { x: ExperienceDoc; page: ScreenPage; html?: string; mockup: string }[] {
  return [...model.experiences.values()].flatMap((x) => {
    const page = dryPage(model, x.data.screen);
    if (!page) return [];
    const mockup = mockupPath(x.data.screen);
    const html = contentOf(model, mockup);
    return [{ x, page, mockup, ...(html === undefined ? {} : { html }) }];
  });
}

/** Opening tags carrying a data-src, by value (first one wins). */
function bySrc(html: string): Map<string, Tag> {
  const out = new Map<string, Tag>();
  for (const t of tags(html)) {
    const s = t.attrs['data-src'];
    if (s !== undefined && !out.has(s)) out.set(s, t);
  }
  return out;
}

const lineAt = (html: string, offset: number) => html.slice(0, offset).split('\n').length;

export const experienceElements: LintRule = {
  name: 'experience-elements',
  severity: 'error',
  description:
    'An experience screen lists every business element of its screen exactly once, and nothing else; a ready one realises a screen without gaps.',
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const { x, page } of each(model)) {
      const expected = new Set(uxElements(page));
      const seen = new Set<string>();
      x.data.elements.forEach((e, i) => {
        const line = x.lineOf(['elements', i, 'src']);
        if (!expected.has(e.src))
          out.push({ file: x.file, line, id: x.id, message: `${e.src} is not an element of ${page.id}` });
        else if (seen.has(e.src))
          out.push({ file: x.file, line, id: x.id, message: `${e.src} is listed twice` });
        seen.add(e.src);
      });
      for (const src of expected) {
        if (!seen.has(src))
          out.push({ file: x.file, line: x.lineOf(['elements']), id: x.id, message: `${src} is missing` });
      }
      if (READY.has(x.data.status) && page.gaps.length) {
        out.push({
          file: x.file,
          line: x.line,
          id: x.id,
          message: `${x.id} is ${x.data.status} but ${page.id} still has ${page.gaps.length} gap(s) in the business spec`,
        });
      }
    }
    return out;
  },
};

export const experienceMockup: LintRule = {
  name: 'experience-mockup',
  severity: 'error',
  description:
    "An experience screen's mockup carries every business element (data-src), nothing the screen doesn't have, and the right audience (data-roles).",
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const { x, page, html, mockup } of each(model)) {
      if (html === undefined) {
        out.push({ file: x.file, line: x.line, id: x.id, message: `mockup ${mockup} is missing` });
        continue;
      }
      const found = bySrc(html);
      const expected = new Set(uxElements(page));
      for (const src of expected)
        if (!found.has(src))
          out.push({ file: mockup, id: x.id, message: `no element with data-src="${src}"` });
      for (const [src, tag] of found) {
        if (!expected.has(src))
          out.push({
            file: mockup,
            line: lineAt(html, tag.start),
            id: x.id,
            message: `data-src="${src}" is not an element of ${page.id}`,
          });
      }
      for (const [src, roles] of narrowedRoles(page)) {
        const tag = found.get(src);
        if (!tag) continue;
        const have = (tag.attrs['data-roles'] ?? '').split(/\s+/).filter(Boolean).sort().join(' ');
        if (have !== roles.join(' '))
          out.push({
            file: mockup,
            line: lineAt(html, tag.start),
            id: x.id,
            message: `${src} is for ${roles.join(', ') || 'no role'}; set data-roles="${roles.join(' ')}"`,
          });
      }
    }
    return out;
  },
};

export const experienceLabels: LintRule = {
  name: 'experience-labels',
  severity: 'error',
  description: "Each element's text in the mockup contains the label its experience screen declares.",
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const { x, html, mockup } of each(model)) {
      if (html === undefined) continue;
      const found = bySrc(html);
      x.data.elements.forEach((e) => {
        const tag = found.get(e.src);
        if (!tag) return;
        const text = elementText(html, tag);
        if (text === undefined)
          out.push({
            file: mockup,
            line: lineAt(html, tag.start),
            id: x.id,
            message: `can't find where ${e.src} ends`,
          });
        else if (!normalize(text).includes(normalize(e.label)))
          out.push({
            file: mockup,
            line: lineAt(html, tag.start),
            id: x.id,
            message: `${e.src} should read "${e.label}"`,
          });
      });
    }
    return out;
  },
};

export const experienceStates: LintRule = {
  name: 'experience-states',
  severity: 'error',
  description:
    'An experience screen declares a state for each business state and each role of its screen, and its mockup marks every declared state except the default views (data-show-in).',
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const { x, page, html, mockup } of each(model)) {
      const line = x.lineOf(['states']);
      const ids = new Set(x.data.states.map((s) => s.id));
      for (const s of page.states)
        if (!ids.has(s.key)) out.push({ file: x.file, line, id: x.id, message: `no "${s.key}" state` });
      const shownAs = new Set(x.data.states.map((s) => s.as));
      for (const r of page.roles)
        if (!shownAs.has(r.id))
          out.push({ file: x.file, line, id: x.id, message: `no state shown as ${r.id}` });
      if (html === undefined) continue;
      const marked = new Set(
        tags(html).flatMap((t) => (t.attrs['data-show-in'] ?? '').split(/\s+/).filter(Boolean)),
      );
      x.data.states.forEach((s, i) => {
        if (!/^default(-|$)/.test(s.id) && !marked.has(s.id))
          out.push({
            file: x.file,
            line: x.lineOf(['states', i, 'id']),
            id: x.id,
            message: `${mockup} doesn't mark the "${s.id}" state (data-show-in="${s.id}")`,
          });
      });
    }
    return out;
  },
};

export const experienceVocabulary: LintRule = {
  name: 'experience-vocabulary',
  severity: 'error',
  description:
    'Experience screens use archetypes and regions from experience/patterns.md and components from experience/design-system.md.',
  check: ({ model }) => {
    if (model.experiences.size === 0) return [];
    const cat = readCatalog(model);
    const out: RawFinding[] = cat.problems.map((p) => ({ file: p.file, line: 1, message: p.message }));
    for (const x of model.experiences.values()) {
      const regions = cat.archetypes.get(x.data.archetype);
      if (!regions && cat.archetypes.size)
        out.push({
          file: x.file,
          line: x.lineOf(['archetype']),
          id: x.id,
          message: `archetype "${x.data.archetype}" is not in experience/patterns.md`,
        });
      x.data.elements.forEach((e, i) => {
        if (regions && !regions.includes(e.region))
          out.push({
            file: x.file,
            line: x.lineOf(['elements', i, 'region']),
            id: x.id,
            message: `region "${e.region}" is not a region of ${x.data.archetype}`,
          });
        if (cat.components.size && !cat.components.has(e.component))
          out.push({
            file: x.file,
            line: x.lineOf(['elements', i, 'component']),
            id: x.id,
            message: `component "${e.component}" is not in experience/design-system.md`,
          });
      });
    }
    return out;
  },
};

const CHROME_CLASSES = /\bclass="[^"]*\b(ux-review|ux-mock-note|ux-dialog-preview|ux-annotation)\b/;
const SPEC_ID = /\b(?:APP|MOD|CAP|SCR|ROLE|PER|ENT|RULE|FLOW|EVT|DEC|CHG|UX)-[A-Z0-9][A-Z0-9-]*\b/;
const SPEC_WORDS = /\b(mockup|prototype|data-src|alterspec|capability|acceptance criteri)/i;

export const experienceChrome: LintRule = {
  name: 'experience-chrome',
  severity: 'warn',
  description:
    'Mockups show only what real users of the future app would see: no spec IDs, notes about the mockup or reviewer controls.',
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const { x, html, mockup } of each(model)) {
      if (html === undefined) continue;
      const cls = CHROME_CLASSES.exec(html);
      if (cls)
        out.push({
          file: mockup,
          line: lineAt(html, cls.index),
          id: x.id,
          message: `reviewer element "${cls[1]}" on the page`,
        });
      const text = visibleText(html);
      const at = (needle: string) => {
        const i = html.indexOf(needle);
        return i < 0 ? {} : { line: lineAt(html, i) };
      };
      const id = SPEC_ID.exec(text);
      if (id)
        out.push({ file: mockup, ...at(id[0]), id: x.id, message: `the page shows the spec ID ${id[0]}` });
      const word = SPEC_WORDS.exec(text);
      if (word)
        out.push({
          file: mockup,
          ...at(word[1]!),
          id: x.id,
          message: `the page talks about "${word[1]}"; say it as the app would`,
        });
    }
    return out;
  },
};

export const experienceStale: LintRule = {
  name: 'experience-stale',
  severity: 'warn',
  description:
    'Experience screens are aligned with the current business screen (run `alterspec experience sync`).',
  check: ({ model }) =>
    each(model)
      .filter(({ x, page }) => x.data.dry !== dryHash(page))
      .map(({ x, page }) => ({
        file: x.file,
        line: x.data.dry ? x.lineOf(['dry']) : x.line,
        id: x.id,
        message: `${page.id} changed since ${x.id} was aligned; run \`alterspec experience sync ${page.id}\``,
      })),
};

export const experienceMissing: LintRule = {
  name: 'experience-missing',
  severity: 'warn',
  description: 'With an experience layer, every screen that is ready or later has an experience screen.',
  check: ({ model }) => {
    if (!hasExperience(model)) return [];
    const done = new Set([...model.experiences.values()].map((x) => x.data.screen));
    return [...model.screens.values()]
      .filter((s) => READY.has(s.data.status) && !done.has(s.id))
      .map((s) => ({
        file: s.file,
        line: s.line,
        id: s.id,
        message: `${s.id} is ${s.data.status} but has no experience screen; run /alterspec-experience ${s.id}`,
      }));
  },
};

export const experienceUnreviewed: LintRule = {
  name: 'experience-unreviewed',
  severity: 'warn',
  description: 'Experience screens that are ready or later passed a parity review since their last edit.',
  check: ({ model }) =>
    each(model)
      .filter(({ x }) => READY.has(x.data.status))
      .filter(({ x, html }) => x.data.reviewed !== reviewHash(contentOf(model, x.file) ?? '', html))
      .map(({ x }) => ({
        file: x.file,
        line: x.data.reviewed ? x.lineOf(['reviewed']) : x.line,
        id: x.id,
        message: `${x.id} changed since its last parity review; run /alterspec-experience review ${x.data.screen}`,
      })),
};
