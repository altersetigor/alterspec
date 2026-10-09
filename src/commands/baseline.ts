import { join, resolve } from 'node:path';
import { buildBaseline, readBaseline, writeBaseline } from '../changes/baseline.js';
import { loadConfig } from '../config.js';
import { lint } from '../lint/lint.js';
import { readSpecDir } from '../spec/files.js';
import { loadSpec } from '../spec/load.js';

export function runBaseline(dir: string, opts: { spec?: string; force?: boolean } = {}): { objects: number } {
  const root = resolve(dir);
  const specRoot = join(root, opts.spec ?? 'spec');
  if (readBaseline(specRoot) && !opts.force) {
    throw new Error(
      'A baseline already exists; changes go through change proposals now. Use --force only to accept direct edits as the new baseline.',
    );
  }
  const files = readSpecDir(specRoot);
  const errors = lint(loadSpec(files), loadConfig(root), root).filter(
    (f) => f.severity === 'error' && f.rule !== 'direct-edit',
  );
  if (errors.length)
    throw new Error(
      `The spec has ${errors.length} lint error(s); fix them before taking a baseline (run \`alterspec validate\`).`,
    );
  const baseline = buildBaseline(files);
  writeBaseline(specRoot, baseline);
  return { objects: Object.keys(baseline.objects).length };
}
