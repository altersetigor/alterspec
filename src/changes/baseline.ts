import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { SpecFile } from '../spec/files.js';
import { fingerprints } from './fingerprint.js';

export const BASELINE_PATH = '_generated/baseline.json';

export interface Baseline {
  created: string;
  updated?: string;
  objects: Record<string, { hash: string; file: string }>;
}

export function parseBaseline(files: SpecFile[]): Baseline | undefined {
  const f = files.find((x) => x.path === BASELINE_PATH);
  if (!f) return undefined;
  return JSON.parse(f.content) as Baseline;
}

export function readBaseline(specRoot: string): Baseline | undefined {
  const p = join(specRoot, BASELINE_PATH);
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as Baseline) : undefined;
}

export function writeBaseline(specRoot: string, baseline: Baseline) {
  const p = join(specRoot, BASELINE_PATH);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(baseline, null, 2) + '\n');
}

export const today = () => new Date().toISOString().slice(0, 10);

export function buildBaseline(files: SpecFile[]): Baseline {
  return { created: today(), objects: fingerprints(files) };
}
