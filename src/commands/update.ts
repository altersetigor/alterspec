import { existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { packageVersion } from '../assets.js';
import { install, type InstallResult } from '../install/installer.js';
import { buildPlan } from '../install/manifest.js';

export interface UpdateOptions {
  force?: boolean;
}

export function runUpdate(dir: string, opts: UpdateOptions = {}): InstallResult {
  const root = resolve(dir);
  if (!existsSync(join(root, '.alterspec'))) {
    throw new Error(`No .alterspec/ folder in ${root}. Run \`alterspec init\` first.`);
  }
  const version = packageVersion();
  // appName only affects user-owned files, which update never rewrites.
  const plan = buildPlan({ appName: basename(root), version });
  return install(root, plan, { mode: 'update', force: opts.force, version });
}
