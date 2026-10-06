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
import { readSpecDir } from '../spec/files.js';
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

  const errors = lint(load, loadConfig(root)).filter(
    (f) => f.severity === 'error' && f.id && sourceIds.has(f.id),
  );
  if (errors.length) {
    throw new HandoffError(
      `${bundle.scope.id} has ${errors.length} lint error(s) in its scope: ${errors
        .slice(0, 5)
        .map((e) => `${e.id} ${e.rule}`)
        .join(', ')}. Run \`alterspec validate\`.`,
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
      writeFileSync(full, content);
    }
    outputs.push({ target, folder: `handoff/${target}/${bundle.scope.id}`, files: [...out.keys()].sort() });
  }
  return { id: bundle.scope.id, warnings, outputs };
}
