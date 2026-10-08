import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** A spec file, with its path relative to the spec directory (forward slashes). */
export interface SpecFile {
  path: string;
  content: string;
}

const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|bmp|woff2?|ttf|otf|pdf|mp4|webm|mp3)$/i;

/**
 * Encoding a spec file is read and written with. Binary files (mockup images, fonts) go through `latin1`, which maps
 * every byte to one character and back, so they survive fingerprints, change overlays and copies unchanged.
 */
export const encodingOf = (path: string): BufferEncoding => (BINARY.test(path) ? 'latin1' : 'utf8');

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
          content: readFileSync(full, encodingOf(name)),
        });
    }
  };
  walk(specRoot);
  return out;
}
