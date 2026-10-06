import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ASSETS_DIR } from './assets.js';
import { ConfigSchema, type Config } from './schemas/config.js';

/** The project's .alterspec/config.yaml, or the shipped defaults when there is none. */
export function loadConfig(root: string): Config {
  const own = join(root, '.alterspec/config.yaml');
  const path = existsSync(own) ? own : join(ASSETS_DIR, 'config.yaml');
  const result = ConfigSchema.safeParse(parse(readFileSync(path, 'utf8').replace('{{version}}', '0.0.0')));
  if (!result.success) {
    throw new Error(
      `${path} is invalid: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  return result.data;
}
