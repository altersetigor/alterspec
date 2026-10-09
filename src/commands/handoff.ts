import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { packageVersion } from '../assets.js';
import { today } from '../changes/baseline.js';
import { loadConfig } from '../config.js';
import { buildBundle, type Bundle } from '../handoff/bundle.js';
import { renderBundle } from '../handoff/targets/bundle.js';
import type { TargetContext } from '../handoff/targets/common.js';
import { lint } from '../lint/lint.js';
import type { Finding } from '../lint/types.js';
import { EXPERIENCE_DIR, hasExperience, mockupPath } from '../experience/index.js';
import { SPEC_JS, buildSpecJs, configJs, parseConfig, specJs } from '../experience/app.js';
import type { SpecModel } from '../spec/model.js';
import { scopedWireframe } from '../wireframe/index.js';
import { encodingOf, readSpecDir, type SpecFile } from '../spec/files.js';
import { loadSpec } from '../spec/load.js';

/** Handoff has one format: the self-contained bundle, written to `handoff/bundle/<ID>/`. */
export const TARGET = 'bundle';

export interface HandoffOptions {
  spec?: string;
  allowDraft?: boolean;
  /** Date written into the output (YYYY-MM-DD); defaults to today. */
  date?: string;
}

export interface HandoffResult {
  id: string;
  warnings: string[];
  outputs: { target: typeof TARGET; folder: string; files: string[] }[];
}

export class HandoffError extends Error {}

const READY = new Set(['ready', 'approved', 'implemented']);

/**
 * With an experience layer, every screen in scope must have an experience screen that is ready or later and has no
 * findings at all (aligned, complete, reviewed). There is no override: developers only get aligned screens.
 */
function experienceGate(model: SpecModel, bundle: Bundle, findings: Finding[]): string[] {
  if (!hasExperience(model)) return [];
  const out: string[] = [];
  for (const s of bundle.screens) {
    const x = model.experiences.get(`UX-${s.id}`);
    if (!x) {
      out.push(`${s.id} has no experience screen`);
      continue;
    }
    if (!READY.has(x.data.status)) out.push(`${x.id} is ${x.data.status}`);
    const mine = new Set([x.file, mockupPath(s.id)]);
    for (const f of findings) if (f.id === x.id || mine.has(f.file)) out.push(`${x.id} ${f.rule}`);
  }
  return [...new Set(out)];
}

/** The experience layer of the screens in scope, for the bundle: contracts, their mockups and the shared kit. */
function experienceFiles(model: SpecModel, bundle: Bundle): Map<string, string> {
  const scope = new Set(bundle.screens.filter((s) => s.experience).map((s) => s.id));
  const out = new Map<string, string>();
  if (!scope.size) return out;
  for (const f of model.raw) {
    if (!f.path.startsWith(`${EXPERIENCE_DIR}/`)) continue;
    const page = /^experience\/mockups\/(SCR-[^/]+)\.html$/.exec(f.path)?.[1];
    const doc = /^experience\/screens\/UX-(SCR-[^/]+)\.md$/.exec(f.path)?.[1];
    if ((page && !scope.has(page)) || (doc && !scope.has(doc))) continue;
    out.set(f.path, f.content);
  }
  // The spec data the pages read, at the same relative place as in spec/.
  out.set(SPEC_JS, specJs(model));
  // Navigation of the handed-off app: only the screens in scope.
  const configPath = `${EXPERIENCE_DIR}/mockups/config.js`;
  const config = parseConfig(out.get(configPath) ?? '');
  if (config) {
    const screens = buildSpecJs(model).screens;
    const top = [...scope].filter((s) => screens[s]?.top);
    out.set(configPath, configJs({ ...config, nav: top.length ? top : [...scope] }));
  }
  return new Map([...out].sort(([a], [b]) => (a < b ? -1 : 1)));
}

/**
 * Why a bundle may not go to developers yet, in the order the checks run: lint errors in scope, an experience layer
 * that doesn't match the spec, capabilities below `ready` (the last one is a warning instead when drafts are allowed).
 * Empty when the bundle may be handed off.
 */
export function handoffBlockers(
  model: SpecModel,
  findings: Finding[],
  bundle: Bundle,
  opts: { allowDraft?: boolean } = {},
): { blockers: string[]; warnings: string[] } {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const sourceIds = new Set(bundle.sources.map((s) => s.id));
  const errors = findings.filter((f) => f.severity === 'error' && f.id && sourceIds.has(f.id));
  if (errors.length) {
    blockers.push(
      `${bundle.scope.id} has ${errors.length} lint error(s) in its scope: ${errors
        .slice(0, 5)
        .map((e) => `${e.id} ${e.rule}`)
        .join(', ')}. Run \`alterspec validate\`.`,
    );
  }
  const experience = experienceGate(model, bundle, findings);
  if (experience.length) {
    blockers.push(
      `${bundle.scope.id} isn't ready for developers: its experience layer doesn't fully match the spec (${experience
        .slice(0, 6)
        .join('; ')}${experience.length > 6 ? '; …' : ''}). Finish it with /alterspec-experience.`,
    );
  }
  const drafts = bundle.capabilities.filter((c) => !READY.has(c.status));
  if (drafts.length) {
    const msg = `${drafts.map((c) => `${c.id} is ${c.status}`).join(', ')}; handoff expects ready or later`;
    if (opts.allowDraft) warnings.push(msg);
    else blockers.push(`${msg}. Refine it first, or pass --allow-draft.`);
  }
  return { blockers, warnings };
}

/** Build the bundle of an ID over already loaded, already linted files and say whether it may be handed off. */
export function handoffCheck(
  model: SpecModel,
  files: SpecFile[],
  findings: Finding[],
  rawId: string,
  opts: { allowDraft?: boolean } = {},
): { bundle: Bundle; blockers: string[]; warnings: string[] } {
  const bundle = buildBundle(model, files, rawId);
  return { bundle, ...handoffBlockers(model, findings, bundle, opts) };
}

export function runHandoff(dir: string, rawId: string, opts: HandoffOptions = {}): HandoffResult {
  const root = resolve(dir);
  const specRoot = join(root, opts.spec ?? 'spec');
  const files = readSpecDir(specRoot);
  const load = loadSpec(files);
  const findings = lint(load, loadConfig(root), root);
  const { bundle, blockers, warnings } = handoffCheck(load.model, files, findings, rawId, opts);
  if (blockers.length) throw new HandoffError(blockers[0]!);
  const open =
    bundle.openQuestions.length + bundle.capabilities.reduce((n, c) => n + c.text.openQuestions.length, 0);
  if (open) warnings.push(`${open} open question(s) in scope; they are exported as clarification points`);

  const ctx: TargetContext = { date: opts.date ?? today(), version: packageVersion() };
  const folder = join(root, 'handoff', TARGET, bundle.scope.id);
  rmSync(folder, { recursive: true, force: true });
  const out = renderBundle(bundle, ctx);
  if (bundle.screens.length) {
    const pages = scopedWireframe(
      load.model,
      bundle.screens.map((s) => s.id),
      '<!-- Generated by `alterspec handoff` from the spec. Made-up data; the spec is the source of truth. -->',
    );
    for (const [p, c] of pages) out.set(`wireframe/${p}`, c);
    for (const [p, c] of experienceFiles(load.model, bundle)) out.set(p, c);
  }
  out.set(
    'manifest.json',
    JSON.stringify(
      {
        alterspec: ctx.version,
        target: TARGET,
        scope: bundle.scope,
        exported: ctx.date,
        sources: bundle.sources,
      },
      null,
      2,
    ) + '\n',
  );
  for (const [path, content] of out) {
    const full = join(folder, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, encodingOf(path));
  }
  const outputs: HandoffResult['outputs'] = [
    { target: TARGET, folder: `handoff/${TARGET}/${bundle.scope.id}`, files: [...out.keys()].sort() },
  ];
  return { id: bundle.scope.id, warnings, outputs };
}
