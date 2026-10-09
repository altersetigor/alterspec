import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { ASSETS_DIR, packageVersion } from '../assets.js';
import { sha256 } from '../install/hash.js';
import { readManifest } from '../install/installer.js';
import { ConfigSchema } from '../schemas/config.js';

export interface Check {
  ok: boolean;
  message: string;
}

export function runDoctor(dir: string): Check[] {
  const root = resolve(dir);
  const checks: Check[] = [];
  const major = Number(process.versions.node.split('.')[0]);
  checks.push({ ok: major >= 20, message: `Node ${process.versions.node} (needs 20 or later)` });

  if (!existsSync(join(root, '.alterspec'))) {
    checks.push({ ok: false, message: 'No .alterspec/ folder. Run `alterspec init`.' });
    return checks;
  }

  const installed = existsSync(join(root, '.alterspec/version'))
    ? readFileSync(join(root, '.alterspec/version'), 'utf8').trim()
    : 'unknown';
  const current = packageVersion();
  checks.push({
    ok: installed === current,
    message:
      installed === current
        ? `Installed framework version ${installed}`
        : `Installed framework version ${installed}, CLI is ${current}. Run \`alterspec update\`.`,
  });

  const configPath = join(root, '.alterspec/config.yaml');
  if (!existsSync(configPath)) {
    checks.push({ ok: false, message: '.alterspec/config.yaml is missing. Run `alterspec init`.' });
  } else {
    const parsed = ConfigSchema.safeParse(parse(readFileSync(configPath, 'utf8')));
    checks.push({
      ok: parsed.success,
      message: parsed.success
        ? '.alterspec/config.yaml is valid'
        : `.alterspec/config.yaml is invalid: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    });
  }

  const customPrompts = join(root, '.alterspec/custom/prompts');
  if (existsSync(customPrompts)) {
    const shipped = new Set(
      (readdirSync(join(ASSETS_DIR, 'prompts'), { recursive: true }) as string[]).map((p) =>
        p.split('\\').join('/'),
      ),
    );
    for (const p of readdirSync(customPrompts, { recursive: true }) as string[]) {
      const rel = p.split('\\').join('/');
      if (rel.endsWith('.md') && !shipped.has(rel)) {
        checks.push({
          ok: false,
          message: `.alterspec/custom/prompts/${rel} overrides no prompt (renamed in this version?); it is not used`,
        });
      }
    }
  }

  const customTemplates = join(root, '.alterspec/custom/templates');
  if (existsSync(customTemplates)) {
    const shipped = new Set(readdirSync(join(ASSETS_DIR, 'templates')));
    for (const name of readdirSync(customTemplates)) {
      if (name.endsWith('.md') && !shipped.has(name)) {
        checks.push({
          ok: false,
          message: `.alterspec/custom/templates/${name} overrides no template (renamed in this version?); it is not used`,
        });
      }
    }
  }

  const manifest = readManifest(root);
  if (!manifest) {
    checks.push({ ok: false, message: '.alterspec/manifest.json is missing. Run `alterspec update`.' });
    return checks;
  }
  for (const [path, hash] of Object.entries(manifest.files)) {
    if (!path.startsWith('.claude/')) continue;
    const full = join(root, path);
    if (!existsSync(full)) checks.push({ ok: false, message: `Missing ${path}. Run \`alterspec update\`.` });
    else if (sha256(readFileSync(full, 'utf8')) !== hash) {
      checks.push({
        ok: false,
        message: `Modified ${path}. Put customisations in .alterspec/custom/ instead.`,
      });
    }
  }
  if (!checks.some((c) => !c.ok && c.message.includes('.claude/'))) {
    checks.push({ ok: true, message: 'Claude Code wrappers are in place' });
  }
  return checks;
}
