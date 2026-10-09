import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { ASSETS_DIR } from '../assets.js';
import { readTemplate } from '../lib/templates.js';
import { runViews } from './views.js';
import { readBaseline } from '../changes/baseline.js';
import { loadChange, type LoadedChange } from '../changes/change.js';
import { SKIP_FOR_CHANGES } from '../changes/impact.js';
import { mergeChange, overlayObjects } from '../changes/merge.js';
import { loadConfig } from '../config.js';
import { PATTERNS_FILE } from '../experience/catalog.js';
import { elementEnd, tags, withAttr } from '../experience/html.js';
import {
  EXPERIENCE_DIR,
  contentOf,
  dryHash,
  dryPage,
  experiencePath,
  mockupPath,
  narrowedRoles,
  reviewHash,
  uxElements,
} from '../experience/index.js';
import { draftDoc, draftElements, draftMockup, draftStates, pageHash } from '../experience/scaffold.js';
import {
  SCRIPTS,
  SPEC_JS,
  configJs,
  dataJs,
  defaultConfig,
  loginHtml,
  mergeConfig,
  parseConfig,
  seedData,
  specJs,
} from '../experience/app.js';
import { lint } from '../lint/lint.js';
import { esc } from '../wireframe/render.js';
import type { ExperienceScreen } from '../schemas/experience.js';
import { readSpecDir } from '../spec/files.js';
import { loadSpec } from '../spec/load.js';
import type { SpecModel } from '../spec/model.js';
import { changeEdit, recordNew, writeGroom } from './change.js';
import { liftOf, liftTable, type Lift } from '../experience/lift.js';

export class ExperienceError extends Error {}

export interface ExperienceOptions {
  spec?: string;
  /** Work inside this change proposal (required once a baseline exists). */
  change?: string;
}

const STARTER = ['design-system.md', 'patterns.md'];
const KIT = ['tokens.css', 'components.css', 'icons.js', 'store.js', 'ui.js', 'app.js'];
const MOCKUPS = `${EXPERIENCE_DIR}/mockups`;

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
  const merged = change ? mergeChange(files, change, root) : files;
  const load = loadSpec(merged);
  const inSpec = new Set(files.map((f) => f.path));
  const specDir = opts.spec ?? 'spec';

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
  /**
   * Make the pages openable in a browser: the spec data they load (`_generated/experience/spec.js`) is written by
   * `views`; inside a change it doesn't exist yet, so a preview copy built from the merged spec goes into the overlay
   * (generated output: never merged, never fingerprinted).
   */
  const preview = () => {
    if (change) {
      const full = join(change.overlayRoot, SPEC_JS);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, specJs(load.model));
    } else runViews(root, { spec: specDir });
  };
  return { root, specRoot, model: load.model, load, change, put, preview };
}

const kitFiles = (): [string, string][] =>
  KIT.map((f): [string, string] => [
    `mockups/kit/${f}`,
    readFileSync(join(ASSETS_DIR, 'experience/mockups/kit', f), 'utf8'),
  ]);

/** The app config of the layer (or a fresh one), merged with what the spec now needs. */
function configOf(model: SpecModel) {
  const text = contentOf(model, `${MOCKUPS}/config.js`);
  const current = text === undefined ? undefined : parseConfig(text);
  if (text !== undefined && !current)
    throw new ExperienceError(`${MOCKUPS}/config.js is not valid JSON after \`window.UX_APP =\``);
  return current ? mergeConfig(current, model) : defaultConfig(model);
}

export interface ExperienceInitResult {
  created: string[];
  skipped: string[];
  updated: string[];
}

/**
 * Add the starter design system, patterns and the mockup app (kit, config, spec, demo data, sign-in page) to
 * spec/experience/. Never overwrites, except with `kit`: then the kit and the sign-in page are refreshed to this version.
 */
export function runExperienceInit(
  dir: string,
  opts: ExperienceOptions & { kit?: boolean } = {},
): ExperienceInitResult {
  const ws = workspace(dir, opts);
  const result: ExperienceInitResult = { created: [], skipped: [], updated: [] };
  const config = configOf(ws.model);
  const files: [string, string, boolean][] = [
    ...STARTER.map((f): [string, string, boolean] => [
      f,
      readFileSync(join(ASSETS_DIR, 'experience', f), 'utf8'),
      false,
    ]),
    ...kitFiles().map(([f, c]): [string, string, boolean] => [f, c, true]),
    ['mockups/config.js', configJs(config), false],
    ['mockups/data.js', dataJs(seedData(ws.model, config)), false],
    ['mockups/index.html', loginHtml(config.name), true],
  ];
  for (const [name, content, refresh] of files) {
    const path = `${EXPERIENCE_DIR}/${name}`;
    const have = contentOf(ws.model, path);
    if (have === undefined) {
      ws.put(path, content);
      result.created.push(path);
    } else if (opts.kit && refresh && have !== content) {
      ws.put(path, content);
      result.updated.push(path);
    } else result.skipped.push(path);
  }
  ws.preview();
  return result;
}

export interface ExperienceSeedResult {
  files: string[];
  records: number;
}

/** Rewrite the demo data from the spec (and add demo users the config is missing). Replaces data.js. */
export function runExperienceSeed(dir: string, opts: ExperienceOptions = {}): ExperienceSeedResult {
  const ws = workspace(dir, opts);
  if (contentOf(ws.model, PATTERNS_FILE) === undefined)
    throw new ExperienceError('no experience layer yet; run `alterspec experience init` first');
  const config = configOf(ws.model);
  const data = seedData(ws.model, config);
  ws.put(`${MOCKUPS}/config.js`, configJs(config));
  ws.put(`${MOCKUPS}/data.js`, dataJs(data));
  return {
    files: [`${MOCKUPS}/config.js`, `${MOCKUPS}/data.js`],
    records: Object.values(data.entities).reduce((n, r) => n + r.length, 0),
  };
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
  const template = readTemplate(ws.root, 'experience-screen.md');
  const html = draftMockup(ws.model, page);
  ws.put(doc, draftDoc(template, page, html));
  ws.put(mockupPath(id), html);
  if (ws.change) ws.preview();
  return { screen: id, files: [doc, mockupPath(id)] };
}

/** Where `rebuild` leaves the reference render of a page it kept, relative to spec/. */
export const REBUILD_DIR = '_generated/experience/rebuild';

export interface ExperienceRebuildResult {
  screen: string;
  /** Files written into the spec (the page, and the contract's `page:` line) when the page was replaced. */
  files: string[];
  /** True when the page has hand edits and was kept. */
  kept: boolean;
  /** The fresh render, written next to the generated views for the designer to merge from (kept pages only). */
  reference?: string;
  /** `data-src` values on the page that the business spec doesn't have: content for the spec change flow. */
  businessChange: string[];
  /** Deterministic findings of this screen's contract and page. */
  findings: { rule: string; file: string; line?: number; message: string }[];
  /** The page doesn't load the current kit the way a fresh render does. */
  kitOutdated: boolean;
}

/**
 * Render a screen's mockup again from its experience screen (archetype, regions, components, labels, states) on
 * the current kit. The page is replaced only when it is still exactly what the CLI last rendered. A page with hand
 * edits is kept: the fresh render goes to `_generated/experience/rebuild/<SCR>.html` as a reference, and the result
 * says what differs: business content the spec lacks (which goes through the spec change flow), check findings, and
 * whether the kit markup is outdated. `force` replaces the page anyway; only a person decides that.
 */
export function runExperienceRebuild(
  dir: string,
  screenId: string,
  opts: ExperienceOptions & { force?: boolean } = {},
): ExperienceRebuildResult {
  const ws = workspace(dir, opts);
  const id = screenId.trim().toUpperCase();
  const x = experienceOf(ws.model, id);
  const page = dryPage(ws.model, id);
  if (!page) throw new ExperienceError(`${id} is not a screen in the spec`);
  const mockup = mockupPath(id);
  const current = contentOf(ws.model, mockup);
  const fresh = draftMockup(ws.model, page, x.data);
  const untouched = current === undefined || (x.data.page !== undefined && pageHash(current) === x.data.page);

  if (untouched || opts.force) {
    ws.put(mockup, fresh);
    ws.put(x.file, setLine(contentOf(ws.model, x.file)!, 'page', pageHash(fresh)));
    if (ws.change) ws.preview();
    return {
      screen: id,
      files: [mockup, x.file],
      kept: false,
      businessChange: [],
      findings: [],
      kitOutdated: false,
    };
  }

  const expected = new Set(uxElements(page));
  const srcs = (html: string) =>
    tags(html).flatMap((t) => (t.attrs['data-src'] ? [t.attrs['data-src']] : []));
  const businessChange = [...new Set(srcs(current).filter((s) => !expected.has(s)))].sort();
  const mine = new Set([x.file, mockup]);
  const findings = lint(ws.load, loadConfig(ws.root), ws.root)
    .filter((f) => !(ws.change && SKIP_FOR_CHANGES.has(f.rule)))
    .filter((f) => (mine.has(f.file) || f.id === x.id) && f.rule !== 'experience-unreviewed')
    .map(({ rule, file, line, message }) => ({ rule, file, ...(line ? { line } : {}), message }));
  const kitOutdated = SCRIPTS.some((s) => !current.includes(s)) || !current.includes('kit/components.css');
  const reference = `${REBUILD_DIR}/${id}.html`;
  const full = join(ws.change ? ws.change.overlayRoot : ws.specRoot, reference);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, fresh);
  return { screen: id, files: [], kept: true, reference, businessChange, findings, kitOutdated };
}

export interface ExperienceLiftResult extends Lift {
  /** The grooming document written into the change, prefilled with the lift (only with a change and items). */
  document?: string;
}

/**
 * What a hand-edited experience needs from the business spec: for every marker the spec lacks, the path up the
 * tree (which objects, at which levels, under which names, and the check that fires while a level is missing) and
 * the facts only the person can give. Inside a change it writes a grooming document prefilled with the lift, so the
 * analyst can draft the proposal and the person confirms once. It never edits the business spec.
 */
export function runExperienceLift(
  dir: string,
  screenId: string,
  opts: ExperienceOptions = {},
): ExperienceLiftResult {
  const ws = workspace(dir, opts);
  const id = screenId.trim().toUpperCase();
  const x = experienceOf(ws.model, id);
  const page = dryPage(ws.model, id);
  if (!page) throw new ExperienceError(`${id} is not a screen in the spec`);
  const lift = liftOf(ws.model, page, x.data, contentOf(ws.model, mockupPath(id)) ?? '');
  if (!lift.items.length || !ws.change) return lift;
  const document = writeGroom(ws.root, ws.change.id, `${page.title}: what the mockup needs`, {
    ...(opts.spec ? { spec: opts.spec } : {}),
    idea: `${lift.brief}\n\n${liftTable(lift)}`.trim(),
    name: id,
  });
  return { ...lift, document };
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
  const findings = lint(ws.load, loadConfig(ws.root), ws.root)
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
  /** Elements whose audience (`data-roles`) changed in the mockup. */
  roles: string[];
}

/** Lower-case role name for a state id: ROLE-HR-MANAGER → hr-manager. */
const roleSlug = (role: string) => role.replace(/^ROLE-/, '').toLowerCase();

/**
 * Bring an experience screen and its mockup in line with a changed business screen: drop elements the screen no
 * longer has, add drafts of new ones (to be placed by the designer), add missing states and default views for new
 * roles, update who sees each element, record the new alignment.
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
  const newStates: ExperienceScreen['states'] = [];
  // Business states the screen gained.
  for (const s of draftStates(page)) {
    if (!stateIds.has(s.id) && page.states.some((b) => b.key === s.id)) {
      newStates.push(s);
      stateIds.add(s.id);
    }
  }
  // A default view for every role nobody is shown as yet (the first role may have changed, so never reuse `default`).
  for (const r of page.roles) {
    if (shownAs.has(r.id)) continue;
    let id = stateIds.has('default') ? `default-${roleSlug(r.id)}` : 'default';
    for (let n = 2; stateIds.has(id); n++) id = `default-${roleSlug(r.id)}-${n}`;
    newStates.push({ id, as: r.id });
    stateIds.add(id);
    shownAs.add(r.id);
  }

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
  // Who sees each group and action: narrowed elements carry data-roles, the others none.
  const narrowed = narrowedRoles(page);
  const roles: string[] = [];
  for (const src of [...page.groups.map((g) => g.src), ...page.actions.map((a) => a.src)]) {
    const tag = tags(html).find((t) => t.attrs['data-src'] === src);
    if (!tag) continue;
    const want = narrowed.get(src)?.join(' ');
    const have = tag.attrs['data-roles']?.split(/\s+/).filter(Boolean).sort().join(' ');
    if (want === have) continue;
    html = withAttr(html, tag, 'data-roles', want);
    roles.push(src);
  }
  // The screen's roles on <body>, for the runtime.
  html = html.replace(
    /(<body\b[^>]*\sdata-roles=")([^"]*)(")/,
    (_m, a: string, _b, c: string) => `${a}${esc(page.roles.map((r) => r.id).join(' '))}${c}`,
  );
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
  if (ws.change) ws.preview();
  return { screen: id, added: added.map((e) => e.src), removed, states: newStates.map((s) => s.id), roles };
}
