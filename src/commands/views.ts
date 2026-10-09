import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { readSpecDir } from '../spec/files.js';
import { loadSpec } from '../spec/load.js';
import { changedFiles, planViews } from '../views/plan.js';

export interface ViewsOptions {
  spec?: string;
  /** Don't write; only report what would change. */
  check?: boolean;
}

export interface ViewsResult {
  changed: string[];
  missing: { file: string; block: string }[];
  /** Files skipped because their front-matter doesn't parse or validate. */
  skipped: string[];
}

export function runViews(dir: string, opts: ViewsOptions = {}): ViewsResult {
  const specRoot = join(resolve(dir), opts.spec ?? 'spec');
  const load = loadSpec(readSpecDir(specRoot));
  const plan = planViews(load.model);
  const changed = changedFiles(load.model, plan);
  if (!opts.check) {
    for (const path of plan.remove) {
      rmSync(join(specRoot, path), { force: true });
      // Drop the folders this leaves empty (a removed screen's page, the pre-0.6 prototype/ folder).
      for (let dir = dirname(path); dir.startsWith('_generated/'); dir = dirname(dir)) {
        const full = join(specRoot, dir);
        if (existsSync(full) && readdirSync(full).length === 0) rmSync(full, { recursive: true });
        else break;
      }
    }
    for (const path of changed) {
      if (!plan.files.has(path)) continue;
      const full = join(specRoot, path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, plan.files.get(path) ?? '');
    }
  }
  const skipped = [
    ...new Set(
      load.findings.filter((f) => f.rule === 'schema' || f.rule === 'yaml-syntax').map((f) => f.file),
    ),
  ].sort();
  return { changed, missing: plan.missing, skipped };
}
