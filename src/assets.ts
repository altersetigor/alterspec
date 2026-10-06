import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Package root: one level above both src/ (tests) and dist/ (built CLI). */
const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));

export const ASSETS_DIR = fileURLToPath(new URL('../assets', import.meta.url));

export function packageVersion(): string {
  const pkg = JSON.parse(readFileSync(`${PACKAGE_ROOT}/package.json`, 'utf8')) as { version: string };
  return pkg.version;
}
