import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXAMPLE = fileURLToPath(new URL('../examples/catalog', import.meta.url));

export function copyExample(): string {
  const dir = mkdtempSync(join(tmpdir(), 'alterspec-example-'));
  cpSync(EXAMPLE, dir, { recursive: true });
  return dir;
}
