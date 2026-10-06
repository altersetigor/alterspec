import type { SpecModel } from '../spec/model.js';
import { renderGeneratedFile, replaceBlocks } from './blocks.js';
import {
  appRoleMatrix,
  coverage,
  entityCoverage,
  index,
  moduleCapabilities,
  moduleRoleMatrix,
  moduleScreens,
  screenCapabilities,
  traceability,
} from './render.js';

export interface ViewsPlan {
  /** Desired content of every file views owns or touches (path relative to spec/). */
  files: Map<string, string>;
  /** Desired content per block, per file (for the views-stale lint rule). */
  blocks: Map<string, Record<string, string>>;
  /** Expected blocks a file doesn't have. Views doesn't add them. */
  missing: { file: string; block: string }[];
}

export function planViews(model: SpecModel): ViewsPlan {
  const plan: ViewsPlan = { files: new Map(), blocks: new Map(), missing: [] };
  const content = new Map(model.raw.map((f) => [f.path, f.content]));

  const fill = (file: string, desired: Record<string, string>) => {
    const current = content.get(file);
    if (current === undefined) return;
    const { text, missing } = replaceBlocks(current, desired);
    plan.files.set(file, text);
    plan.blocks.set(file, desired);
    for (const block of missing) plan.missing.push({ file, block });
  };

  for (const mod of model.modules.values()) {
    fill(mod.file, {
      capabilities: moduleCapabilities(model, mod),
      'role-matrix': moduleRoleMatrix(model, mod),
      screens: moduleScreens(model, mod),
    });
  }
  for (const s of model.screens.values())
    fill(s.file, { 'screen-capabilities': screenCapabilities(model, s.id) });
  for (const e of model.entities.values()) fill(e.file, { 'entity-coverage': entityCoverage(model, e.id) });

  plan.files.set('_generated/traceability.md', renderGeneratedFile(traceability(model)));
  plan.files.set('_generated/coverage.md', renderGeneratedFile(coverage(model)));
  plan.files.set('_generated/role-matrix.md', renderGeneratedFile(appRoleMatrix(model)));
  plan.files.set('_generated/index.json', index(model));
  return plan;
}

/** Files whose desired content differs from what's on disk. */
export function changedFiles(model: SpecModel, plan: ViewsPlan): string[] {
  const content = new Map(model.raw.map((f) => [f.path, f.content]));
  return [...plan.files]
    .filter(([path, text]) => content.get(path) !== text)
    .map(([path]) => path)
    .sort();
}
