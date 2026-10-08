import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { ASSETS_DIR } from '../assets.js';
import { readBaseline } from '../changes/baseline.js';
import { loadChange, type LoadedChange } from '../changes/change.js';
import { SKIP_FOR_CHANGES } from '../changes/impact.js';
import { mergeChange, overlayObjects } from '../changes/merge.js';
import { loadConfig } from '../config.js';
import { PATTERNS_FILE } from '../experience/catalog.js';
import { elementEnd, tags } from '../experience/html.js';
import {
  EXPERIENCE_DIR,
  contentOf,
  dryHash,
  dryModel,
  dryPage,
  experiencePath,
  mockupPath,
  reviewHash,
  uxElements,
} from '../experience/index.js';
import {
  draftDoc,
  draftElements,
  draftMockup,
  draftStates,
  indexHtml,
  navJs,
} from '../experience/scaffold.js';
import { lint } from '../lint/lint.js';
import { esc } from '../prototype/render.js';
import type { ExperienceScreen } from '../schemas/experience.js';
import { readSpecDir } from '../spec/files.js';
import { loadSpec } from '../spec/load.js';
import type { SpecModel } from '../spec/model.js';
import { changeEdit, recordNew } from './change.js';

export class ExperienceError extends Error {}

export interface ExperienceOptions {
  spec?: string;
  /** Work inside this change proposal (required once a baseline exists). */
  change?: string;
}

const STARTER = [
  'design-system.md',
  'patterns.md',
  'mockups/kit/tokens.css',
  'mockups/kit/components.css',
  'mockups/kit/shell.js',
];

/** Where the command reads the spec from and writes to: spec/ directly, or a change's overlay. */
function workspace(dir: string, opts: ExperienceOptions) {
  const root = resolve(dir);
  const specRoot = join(root, opts.spec ?? 'spec');
  const files = readSpecDir(specRoot);
  let change: LoadedChange | undefined;
  if (opts.change) {
    change = loadChange(specRoot, opts.change);
    if (change.proposal.status !== 'draft' && change.proposal.status !== 'in_review')
      throw new ExperienceError(`${change.id} is ${change.proposal.status} and can't be edited`);
  } else if (readBaseline(specRoot)) {
    throw new ExperienceError('the spec has a baseline: work inside a change proposal with --change <CHG>');
  }
  const merged = change ? mergeChange(files, change) : files;
  const load = loadSpec(merged);
  const inSpec = new Set(files.map((f) => f.path));

  /** Write a spec file; in a change, copy or register the object first. */
  const put = (path: string, content: string) => {
    if (change) {
      const key =
        path.endsWith('.md') && path.startsWith(`${EXPERIENCE_DIR}/screens/`)
          ? path.slice(`${EXPERIENCE_DIR}/screens/`.length, -3)
          : `file:${path}`;
      const touched = overlayObjects(loadChange(specRoot, change.id)).has(key);
      if (!touched) {
        if (inSpec.has(path)) changeEdit(specRoot, change.id, key);
        else recordNew(specRoot, change.id, key);
      }
    }
    const full = join(change ? change.overlayRoot : specRoot, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  };
  return { root, specRoot, model: load.model, load, change, put };
}

const designed = (model: SpecModel, plus?: string) =>
  new Set([...[...model.experiences.values()].map((x) => x.data.screen), ...(plus ? [plus] : [])]);

export interface ExperienceInitResult {
  created: string[];
  skipped: string[];
}

/** Copy the starter design system, patterns and mockup kit into spec/experience/. Never overwrites. */
export function runExperienceInit(dir: string, opts: ExperienceOptions = {}): ExperienceInitResult {
  const ws = workspace(dir, opts);
  const result: ExperienceInitResult = { created: [], skipped: [] };
  const files: [string, string][] = [
    ...STARTER.map((f): [string, string] => [f, readFileSync(join(ASSETS_DIR, 'experience', f), 'utf8')]),
    ['mockups/index.html', indexHtml(dryModel(ws.model).title)],
    ['mockups/nav.js', navJs(ws.model, designed(ws.model))],
  ];
  for (const [name, content] of files) {
    const path = `${EXPERIENCE_DIR}/${name}`;
    if (contentOf(ws.model, path) !== undefined) result.skipped.push(path);
    else {
      ws.put(path, content);
      result.created.push(path);
    }
  }
  return result;
}

export interface ExperienceNewResult {
  screen: string;
  files: string[];
}

/** Draft the experience screen and mockup of a business screen. */
export function runExperienceNew(
  dir: string,
  screenId: string,
  opts: ExperienceOptions = {},
): ExperienceNewResult {
  const ws = workspace(dir, opts);
  const id = screenId.trim().toUpperCase();
  if (contentOf(ws.model, PATTERNS_FILE) === undefined)
    throw new ExperienceError('no experience layer yet; run `alterspec experience init` first');
  const page = dryPage(ws.model, id);
  if (!page) throw new ExperienceError(`${id} is not a screen in the spec`);
  const doc = experiencePath(id);
  if (contentOf(ws.model, doc) !== undefined) throw new ExperienceError(`${doc} already exists`);
  const template = readFileSync(join(ASSETS_DIR, 'templates/experience-screen.md'), 'utf8');
  ws.put(doc, draftDoc(template, page));
  ws.put(mockupPath(id), draftMockup(page, dryModel(ws.model).title));
  ws.put(`${EXPERIENCE_DIR}/mockups/nav.js`, navJs(ws.model, designed(ws.model, id)));
  return { screen: id, files: [doc, mockupPath(id), `${EXPERIENCE_DIR}/mockups/nav.js`] };
}

function experienceOf(model: SpecModel, id: string) {
  const x = model.experiences.get(`UX-${id}`);
  if (!x) throw new ExperienceError(`${id} has no experience screen; run \`alterspec experience new ${id}\``);
  return x;
}

export interface ExperienceReviewedResult {
  screen: string;
  reviewed?: string;
  findings: { rule: string; file: string; line?: number; message: string }[];
}

/**
 * Record a clean parity review: only when the experience screen and its mockup have no findings at all. The skill
 * runs it after the experience reviewer reported full parity.
 */
export function runExperienceReviewed(
  dir: string,
  screenId: string,
  opts: ExperienceOptions = {},
): ExperienceReviewedResult {
  const ws = workspace(dir, opts);
  const id = screenId.trim().toUpperCase();
  const x = experienceOf(ws.model, id);
  const mine = new Set([x.file, mockupPath(id)]);
  const findings = lint(ws.load, loadConfig(ws.root))
    .filter((f) => !(ws.change && SKIP_FOR_CHANGES.has(f.rule)))
    .filter((f) => (mine.has(f.file) || f.id === x.id) && f.rule !== 'experience-unreviewed')
    .map(({ rule, file, line, message }) => ({ rule, file, ...(line ? { line } : {}), message }));
  if (findings.length) return { screen: id, findings };
  const text = contentOf(ws.model, x.file)!;
  const hash = reviewHash(text, contentOf(ws.model, mockupPath(id)));
  ws.put(x.file, setLine(text, 'reviewed', hash));
  return { screen: id, reviewed: hash, findings: [] };
}

/** Set a top-level `key: value` line in the front-matter, keeping everything else as written. */
function setLine(text: string, key: string, value: string): string {
  const re = new RegExp(`^${key}:.*$`, 'm');
  const end = text.indexOf('\n---', 3);
  const fm = text.slice(0, end);
  if (re.test(fm)) return fm.replace(re, `${key}: ${value}`) + text.slice(end);
  const after = /^(dry|archetype):.*$/m.exec(fm);
  const at = after ? after.index + after[0].length : end;
  return text.slice(0, at) + `\n${key}: ${value}` + text.slice(at);
}

export interface ExperienceSyncResult {
  screen: string;
  added: string[];
  removed: string[];
  states: string[];
}

/**
 * Bring an experience screen and its mockup in line with a changed business screen: drop elements the screen no
 * longer has, add drafts of new ones (to be placed by the designer), add missing states, record the new alignment.
 */
export function runExperienceSync(
  dir: string,
  screenId: string,
  opts: ExperienceOptions = {},
): ExperienceSyncResult {
  const ws = workspace(dir, opts);
  const id = screenId.trim().toUpperCase();
  const x = experienceOf(ws.model, id);
  const page = dryPage(ws.model, id);
  if (!page) throw new ExperienceError(`${id} is not a screen in the spec`);

  const expected = new Set(uxElements(page));
  const declared = new Set(x.data.elements.map((e) => e.src));
  const drafts = draftElements(page, x.data.archetype);
  const added = drafts.filter((d) => !declared.has(d.src));
  const removed = x.data.elements.filter((e) => !expected.has(e.src)).map((e) => e.src);
  const stateIds = new Set(x.data.states.map((s) => s.id));
  const shownAs = new Set(x.data.states.map((s) => s.as));
  const newStates = draftStates(page).filter(
    (s) => !stateIds.has(s.id) && (page.states.some((b) => b.key === s.id) || (s.as && !shownAs.has(s.as))),
  );

  const text = contentOf(ws.model, x.file)!;
  const end = text.indexOf('\n---', 3);
  const doc = parseDocument(text.slice(4, end + 1));
  const elements = (doc.toJS() as ExperienceScreen).elements.filter((e) => expected.has(e.src));
  doc.set('elements', [...elements, ...added]);
  doc.set('states', [...(doc.toJS() as ExperienceScreen).states, ...newStates]);
  doc.set('dry', dryHash(page));
  ws.put(x.file, `---\n${doc.toString({ lineWidth: 0 })}${text.slice(end + 1)}`);

  const mockup = mockupPath(id);
  let html = contentOf(ws.model, mockup) ?? '';
  for (const src of removed) {
    const tag = tags(html).find((t) => t.attrs['data-src'] === src);
    const range = tag && elementEnd(html, tag);
    if (tag && range) html = html.slice(0, tag.start) + html.slice(range.end);
  }
  if (added.length) {
    const block = [
      '<section class="ux-card" data-sync>',
      `<h2 class="ux-card-title">Added by sync: place these</h2>`,
      ...added.map((e) => {
        const state = page.states.find((s) => s.src === e.src);
        return state
          ? `<div class="ux-state" data-src="${esc(e.src)}" data-show-in="${state.key}">${esc(e.label)}</div>`
          : `<div data-src="${esc(e.src)}">${esc(e.label)}</div>`;
      }),
      '</section>',
    ].join('\n');
    html = html.includes('</main>') ? html.replace('</main>', `${block}\n</main>`) : html + block;
  }
  if (newStates.length && /data-states="/.test(html))
    html = html.replace(
      /data-states="([^"]*)"/,
      (_m, s: string) => `data-states="${[s, ...newStates.map((n) => n.id)].join(' ').trim()}"`,
    );
  ws.put(mockup, html);
  return { screen: id, added: added.map((e) => e.src), removed, states: newStates.map((s) => s.id) };
}
