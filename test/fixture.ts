import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.js';
import { lint } from '../src/lint/lint.js';
import type { Finding } from '../src/lint/types.js';
import type { Config } from '../src/schemas/config.js';
import { readSpecDir, type SpecFile } from '../src/spec/files.js';
import { loadSpec, type LoadResult } from '../src/spec/load.js';

export const FIXTURE = fileURLToPath(new URL('./fixtures/valid', import.meta.url));

/** Per-path edit: new content, a transform of the current content, or null to delete. */
export type Edit = string | null | ((current: string) => string);

export function fixtureFiles(edits: Record<string, Edit> = {}): SpecFile[] {
  const files = new Map(readSpecDir(join(FIXTURE, 'spec')).map((f) => [f.path, f.content]));
  for (const [path, edit] of Object.entries(edits)) {
    if (edit === null) files.delete(path);
    else if (typeof edit === 'string') files.set(path, edit);
    else {
      const current = files.get(path);
      if (current === undefined) throw new Error(`fixture has no ${path}`);
      const next = edit(current);
      if (next === current) throw new Error(`edit of ${path} changed nothing`);
      files.set(path, next);
    }
  }
  return [...files].map(([path, content]) => ({ path, content }));
}

export const defaultConfig = (): Config => loadConfig(join(tmpdir(), 'alterspec-no-project'));

export function loadFixture(edits: Record<string, Edit> = {}): LoadResult {
  return loadSpec(fixtureFiles(edits));
}

export function lintFixture(edits: Record<string, Edit> = {}, config: Config = defaultConfig()): Finding[] {
  return lint(loadFixture(edits), config);
}

/** Replace exactly one occurrence, failing loudly if the text isn't there. */
export const replace = (from: string, to: string) => (s: string) => {
  if (!s.includes(from)) throw new Error(`"${from}" not found`);
  return s.replace(from, to);
};

/** Copy the fixture project to a temporary directory. */
export function copyFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), 'alterspec-fixture-'));
  cpSync(FIXTURE, dir, { recursive: true });
  return dir;
}
