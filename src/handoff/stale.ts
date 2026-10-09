import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fingerprint, specObjects } from '../changes/fingerprint.js';
import type { SpecFile } from '../spec/files.js';
import { TARGET } from '../commands/handoff.js';

export interface BundleState {
  /** The bundle's scope: a capability or a module ID. */
  id: string;
  /** Sources whose fingerprint moved since the bundle was exported, or that no longer exist. */
  stale: string[];
}

interface Manifest {
  scope?: { id?: string };
  sources?: { id: string; fingerprint: string }[];
}

/** Every bundle under `handoff/bundle/` with the sources that changed since it was exported (empty when current). */
export function bundleStates(root: string, files: SpecFile[]): BundleState[] {
  const dir = join(root, 'handoff', TARGET);
  if (!existsSync(dir)) return [];
  const objects = specObjects(files);
  const out: BundleState[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name, 'manifest.json');
    if (!existsSync(path)) continue;
    let manifest: Manifest;
    try {
      manifest = JSON.parse(readFileSync(path, 'utf8')) as Manifest;
    } catch {
      continue;
    }
    const id = manifest.scope?.id ?? name;
    const stale = (manifest.sources ?? [])
      .filter((s) => {
        const o = objects.get(s.id);
        return !o || fingerprint(o) !== s.fingerprint;
      })
      .map((s) => s.id);
    out.push({ id, stale });
  }
  return out;
}

export const staleBundles = (root: string, files: SpecFile[]) =>
  bundleStates(root, files).filter((b) => b.stale.length);
