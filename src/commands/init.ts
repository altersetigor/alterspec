import { basename, resolve } from 'node:path';
import { packageVersion } from '../assets.js';
import { install, type InstallResult } from '../install/installer.js';
import { buildPlan } from '../install/manifest.js';

export interface InitOptions {
  name?: string;
}

export function runInit(dir: string, opts: InitOptions = {}): InstallResult {
  const root = resolve(dir);
  const version = packageVersion();
  const plan = buildPlan({ appName: opts.name ?? basename(root), version });
  return install(root, plan, { mode: 'init', version });
}

export function printResult(result: InstallResult, log: (line: string) => void = console.log): void {
  const groups: [keyof InstallResult, string][] = [
    ['created', 'created'],
    ['updated', 'updated'],
    ['removed', 'removed'],
    ['conflicts', 'skipped (modified by you; use --force to overwrite)'],
    ['outdated', 'outdated (run `alterspec update` to refresh)'],
  ];
  for (const [key, label] of groups) {
    const files = result[key];
    if (files.length === 0) continue;
    log(`${label}: ${files.length}`);
    for (const f of files) log(`  ${f}`);
  }
  log(`unchanged: ${result.unchanged.length}, kept (yours): ${result.kept.length}`);
}
