import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { packageVersion } from '../assets.js';
import { today } from '../changes/baseline.js';
import { loadConfig } from '../config.js';
import { buildBundle, slug, type Bundle } from '../handoff/bundle.js';
import { renderBmad } from '../handoff/targets/bmad.js';
import { renderBundle } from '../handoff/targets/bundle.js';
import type { TargetContext, TargetOutput } from '../handoff/targets/common.js';
import { openspecChangeId, renderOpenspec } from '../handoff/targets/openspec.js';
import { renderSpeckit } from '../handoff/targets/speckit.js';
import { lint } from '../lint/lint.js';
import type { Finding } from '../lint/types.js';
import { EXPERIENCE_DIR, hasExperience, mockupPath } from '../experience/index.js';
import { SPEC_JS, buildSpecJs, configJs, parseConfig, specJs } from '../experience/app.js';
import type { SpecModel } from '../spec/model.js';
import { scopedPrototype } from '../prototype/index.js';
import { encodingOf, readSpecDir } from '../spec/files.js';
import { loadSpec } from '../spec/load.js';

export const TARGETS = ['bundle', 'speckit', 'openspec', 'bmad'] as const;
export type Target = (typeof TARGETS)[number];

export interface HandoffOptions {
  spec?: string;
  target?: string;
  allowDraft?: boolean;
  /** Date written into the output (YYYY-MM-DD); defaults to today. */
  date?: string;
}

export interface HandoffResult {
  id: string;
  warnings: string[];
  outputs: { target: Target; folder: string; files: string[] }[];
}

export class HandoffError extends Error {}

const READY = new Set(['ready', 'approved', 'implemented']);

function render(target: Target, b: Bundle, ctx: TargetContext): TargetOutput {
  switch (target) {
    case 'bundle':
      return renderBundle(b, ctx);
    case 'speckit':
      return renderSpeckit(b, ctx, `001-${slug(b.scope.title)}`);
    case 'openspec': {
      const id = openspecChangeId(b);
      return new Map([...renderOpenspec(b, ctx)].map(([p, c]) => [`${id}/${p}`, c]));
    }
    case 'bmad':
      return renderBmad(b, ctx);
  }
}

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

export function runHandoff(dir: string, rawId: string, opts: HandoffOptions = {}): HandoffResult {
  const root = resolve(dir);
  const specRoot = join(root, opts.spec ?? 'spec');
  const targets: Target[] =
    !opts.target || opts.target === 'bundle'
      ? ['bundle']
      : opts.target === 'all'
        ? [...TARGETS]
        : TARGETS.includes(opts.target as Target)
          ? [opts.target as Target]
          : (() => {
              throw new HandoffError(`--target must be one of ${TARGETS.join(', ')} or all`);
            })();

  const files = readSpecDir(specRoot);
  const load = loadSpec(files);
  const bundle = buildBundle(load.model, files, rawId);
  const sourceIds = new Set(bundle.sources.map((s) => s.id));

  const findings = lint(load, loadConfig(root));
  const errors = findings.filter((f) => f.severity === 'error' && f.id && sourceIds.has(f.id));
  if (errors.length) {
    throw new HandoffError(
      `${bundle.scope.id} has ${errors.length} lint error(s) in its scope: ${errors
        .slice(0, 5)
        .map((e) => `${e.id} ${e.rule}`)
        .join(', ')}. Run \`alterspec validate\`.`,
    );
  }
  const experience = experienceGate(load.model, bundle, findings);
  if (experience.length) {
    throw new HandoffError(
      `${bundle.scope.id} isn't ready for developers: its experience layer doesn't fully match the spec (${experience
        .slice(0, 6)
        .join('; ')}${experience.length > 6 ? '; …' : ''}). Finish it with /alterspec-experience.`,
    );
  }
  const warnings: string[] = [];
  const drafts = bundle.capabilities.filter((c) => !READY.has(c.status));
  if (drafts.length) {
    const msg = `${drafts.map((c) => `${c.id} is ${c.status}`).join(', ')}; handoff expects ready or later`;
    if (!opts.allowDraft) throw new HandoffError(`${msg}. Refine it first, or pass --allow-draft.`);
    warnings.push(msg);
  }
  const open =
    bundle.openQuestions.length + bundle.capabilities.reduce((n, c) => n + c.text.openQuestions.length, 0);
  if (open) warnings.push(`${open} open question(s) in scope; they are exported as clarification points`);

  const ctx: TargetContext = { date: opts.date ?? today(), version: packageVersion() };
  const outputs: HandoffResult['outputs'] = [];
  for (const target of targets) {
    const folder = join(root, 'handoff', target, bundle.scope.id);
    rmSync(folder, { recursive: true, force: true });
    const out = render(target, bundle, ctx);
    if (target === 'bundle' && bundle.screens.length) {
      const pages = scopedPrototype(
        load.model,
        bundle.screens.map((s) => s.id),
        '<!-- Generated by `alterspec handoff` from the spec. Made-up data; the spec is the source of truth. -->',
      );
      for (const [p, c] of pages) out.set(`prototype/${p}`, c);
      for (const [p, c] of experienceFiles(load.model, bundle)) out.set(p, c);
    }
    out.set(
      'manifest.json',
      JSON.stringify(
        { alterspec: ctx.version, target, scope: bundle.scope, exported: ctx.date, sources: bundle.sources },
        null,
        2,
      ) + '\n',
    );
    for (const [path, content] of out) {
      const full = join(folder, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content, encodingOf(path));
    }
    outputs.push({ target, folder: `handoff/${target}/${bundle.scope.id}`, files: [...out.keys()].sort() });
  }
  return { id: bundle.scope.id, warnings, outputs };
}
