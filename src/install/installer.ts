import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { sha256 } from './hash.js';
import type { PlannedFile } from './manifest.js';

export const MANIFEST_PATH = '.alterspec/manifest.json';

export interface Manifest {
  version: string;
  /** Hash of the content alterspec last wrote, per framework/wrapper file. */
  files: Record<string, string>;
}

export interface InstallOptions {
  mode: 'init' | 'update';
  /** Overwrite wrappers the user modified. */
  force?: boolean;
  version: string;
}

export interface InstallResult {
  created: string[];
  updated: string[];
  unchanged: string[];
  /** User-owned files that already existed. */
  kept: string[];
  /** Framework files that differ from this version (init only fills gaps; `update` refreshes them). */
  outdated: string[];
  /** Wrappers the user modified; skipped unless --force. */
  conflicts: string[];
  /** Framework files from an older version that are no longer shipped. */
  removed: string[];
}

export function readManifest(root: string): Manifest | undefined {
  const p = join(root, MANIFEST_PATH);
  if (!existsSync(p)) return undefined;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as Manifest;
  } catch {
    return undefined;
  }
}

function write(root: string, path: string, content: string) {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

/** Apply an install plan to a project. Never touches user-owned files that exist. */
export function install(root: string, plan: PlannedFile[], opts: InstallOptions): InstallResult {
  const result: InstallResult = {
    created: [],
    updated: [],
    unchanged: [],
    kept: [],
    outdated: [],
    conflicts: [],
    removed: [],
  };
  const previous = readManifest(root);
  const next: Manifest = { version: opts.version, files: {} };

  for (const file of plan) {
    const full = join(root, file.path);
    const newHash = sha256(file.content);

    if (!existsSync(full)) {
      write(root, file.path, file.content);
      result.created.push(file.path);
      if (file.policy !== 'user') next.files[file.path] = newHash;
      continue;
    }

    if (file.policy === 'user') {
      result.kept.push(file.path);
      continue;
    }

    const diskHash = sha256(readFileSync(full, 'utf8'));
    if (diskHash === newHash) {
      result.unchanged.push(file.path);
      next.files[file.path] = newHash;
      continue;
    }

    if (opts.mode === 'init') {
      result.outdated.push(file.path);
      next.files[file.path] = previous?.files[file.path] ?? diskHash;
      continue;
    }

    // update
    const userModified = file.policy === 'wrapper' && previous?.files[file.path] !== diskHash;
    if (userModified && !opts.force) {
      result.conflicts.push(file.path);
      next.files[file.path] = previous?.files[file.path] ?? diskHash;
      continue;
    }
    write(root, file.path, file.content);
    result.updated.push(file.path);
    next.files[file.path] = newHash;
  }

  // Remove framework files and unmodified wrappers that this version no longer ships.
  if (opts.mode === 'update' && previous) {
    const planned = new Set(plan.map((f) => f.path));
    for (const [path, hash] of Object.entries(previous.files)) {
      if (planned.has(path)) continue;
      const full = join(root, path);
      if (!existsSync(full)) continue;
      if (sha256(readFileSync(full, 'utf8')) === hash) {
        rmSync(full);
        result.removed.push(path);
        // A skill folder of a wrapper this version no longer ships: drop it once it is empty.
        const folder = dirname(full);
        if (/\.claude\/skills\/[^/]+$/.test(folder) && readdirSync(folder).length === 0)
          rmSync(folder, { recursive: true });
      } else {
        result.conflicts.push(path);
      }
    }
  }

  write(root, MANIFEST_PATH, JSON.stringify(next, null, 2) + '\n');
  return result;
}
