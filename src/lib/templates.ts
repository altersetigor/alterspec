import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ASSETS_DIR } from '../assets.js';

/** Where a project's template overrides live, relative to the project root. */
export const CUSTOM_TEMPLATES = '.alterspec/custom/templates';

/**
 * Path of a template: the project's override in `.alterspec/custom/templates/<name>` when there is one, otherwise
 * the shipped template. Without a project root only the shipped template is used.
 */
export function templatePath(root: string | undefined, name: string): string {
  if (root) {
    const custom = join(root, CUSTOM_TEMPLATES, name);
    if (existsSync(custom)) return custom;
  }
  return join(ASSETS_DIR, 'templates', name);
}

export const readTemplate = (root: string | undefined, name: string): string =>
  readFileSync(templatePath(root, name), 'utf8');
