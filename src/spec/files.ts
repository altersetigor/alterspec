import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** A spec file, with its path relative to the spec directory (forward slashes). */
export interface SpecFile {
  path: string;
  content: string;
}

/** Read every file under the spec directory. */
export function readSpecDir(specRoot: string): SpecFile[] {
  if (!existsSync(specRoot)) throw new Error(`No spec folder at ${specRoot}. Run \`alterspec init\` first.`);
  const out: SpecFile[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else
        out.push({
          path: relative(specRoot, full).split(sep).join('/'),
          content: readFileSync(full, 'utf8'),
        });
    }
  };
  walk(specRoot);
  return out;
}
