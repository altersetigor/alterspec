import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { z } from 'zod';
import { ASSETS_DIR } from '../src/assets.js';

export const tmpProject = () => mkdtempSync(join(tmpdir(), 'alterspec-'));

export const readAsset = (p: string) => readFileSync(join(ASSETS_DIR, p), 'utf8');

/** Format zod issues for readable assertion failures. */
export function issues(result: z.ZodSafeParseResult<unknown>): string[] {
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
}
