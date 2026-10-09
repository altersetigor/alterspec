import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { runDoctor } from '../src/commands/doctor.js';
import { runInit } from '../src/commands/init.js';
import { runUpdate } from '../src/commands/update.js';
import { sha256 } from '../src/install/hash.js';
import { MANIFEST_PATH, readManifest } from '../src/install/installer.js';
import { parseCollection } from '../src/lib/collection.js';
import { parseFrontMatter } from '../src/lib/frontmatter.js';
import { ApplicationSchema, ConfigSchema } from '../src/schemas/index.js';
import { issues, tmpProject } from './helpers.js';

const read = (root: string, p: string) => readFileSync(join(root, p), 'utf8');
const put = (root: string, p: string, c: string) => {
  mkdirSync(join(root, p, '..'), { recursive: true });
  writeFileSync(join(root, p), c);
};

describe('alterspec init', () => {
  it('creates .alterspec/, .claude/ wrappers and the spec/ skeleton', () => {
    const root = tmpProject();
    const result = runInit(root, { name: 'Demo' });
    expect(result.kept).toEqual([]);

    for (const p of [
      '.alterspec/config.yaml',
      '.alterspec/version',
      '.alterspec/custom/README.md',
      '.alterspec/templates/capability.md',
      '.alterspec/prompts/create-capability.md',
      '.alterspec/prompts/agents/reviewer.md',
      '.alterspec/schemas/capability.schema.json',
      '.claude/skills/alterspec-init/SKILL.md',
      '.claude/skills/alterspec-handoff/SKILL.md',
      '.claude/agents/alterspec-analyst.md',
      '.claude/agents/alterspec-reviewer.md',
      'spec/application/application.md',
      'spec/application/personas-roles.md',
      'spec/application/glossary.md',
      'spec/application/rules.md',
      'spec/application/events.md',
      'spec/application/integrations.md',
      'spec/application/nfr.md',
      'spec/application/decisions.md',
      'spec/application/entities/.gitkeep',
      'spec/application/flows/.gitkeep',
      'spec/modules/.gitkeep',
      'spec/changes/archive/.gitkeep',
      'spec/_generated/README.md',
      MANIFEST_PATH,
    ]) {
      expect(existsSync(join(root, p)), p).toBe(true);
    }
  });

  it('writes a valid skeleton: application front-matter, config, empty collections', () => {
    const root = tmpProject();
    runInit(root, { name: 'Demo' });
    const app = parseFrontMatter(read(root, 'spec/application/application.md'));
    expect(issues(ApplicationSchema.safeParse(app.data))).toEqual([]);
    expect((app.data as { title: string }).title).toBe('Demo');
    expect(issues(ConfigSchema.safeParse(parse(read(root, '.alterspec/config.yaml'))))).toEqual([]);
    for (const f of ['personas-roles', 'glossary', 'rules', 'events', 'decisions']) {
      const src = read(root, `spec/application/${f}.md`);
      expect(src, f).not.toContain('{{');
      expect(parseCollection(src), f).toEqual([]);
    }
    const schema = JSON.parse(read(root, '.alterspec/schemas/capability.schema.json')) as {
      properties: object;
    };
    expect(Object.keys(schema.properties)).toContain('roles');
  });

  it('is idempotent: a second run changes nothing', () => {
    const root = tmpProject();
    runInit(root);
    const manifest = read(root, MANIFEST_PATH);
    const second = runInit(root);
    expect(second.created).toEqual([]);
    expect(second.updated).toEqual([]);
    expect(second.outdated).toEqual([]);
    expect(read(root, MANIFEST_PATH)).toBe(manifest);
  });

  it('never overwrites spec/, config.yaml, custom/ or other .claude files', () => {
    const root = tmpProject();
    put(root, '.claude/skills/my-own/SKILL.md', 'mine');
    put(root, '.claude/settings.json', '{}');
    runInit(root);
    put(root, 'spec/application/glossary.md', 'edited glossary');
    put(root, '.alterspec/config.yaml', 'version: "0.0.1"\nlanguage: en\n');
    put(root, '.alterspec/custom/prompts/create-capability.md', 'my prompt');
    rmSync(join(root, 'spec/application/nfr.md'));

    const again = runInit(root);
    expect(read(root, 'spec/application/glossary.md')).toBe('edited glossary');
    expect(read(root, '.alterspec/config.yaml')).toBe('version: "0.0.1"\nlanguage: en\n');
    expect(read(root, '.alterspec/custom/prompts/create-capability.md')).toBe('my prompt');
    expect(read(root, '.claude/skills/my-own/SKILL.md')).toBe('mine');
    expect(read(root, '.claude/settings.json')).toBe('{}');
    // missing user files are filled in again
    expect(again.created).toEqual(['spec/application/nfr.md']);
  });

  it('init does not overwrite outdated framework files; it reports them', () => {
    const root = tmpProject();
    runInit(root);
    put(root, '.alterspec/templates/capability.md', 'old template');
    const again = runInit(root);
    expect(again.outdated).toEqual(['.alterspec/templates/capability.md']);
    expect(read(root, '.alterspec/templates/capability.md')).toBe('old template');
  });
});

describe('alterspec update', () => {
  it('fails without .alterspec/', () => {
    expect(() => runUpdate(tmpProject())).toThrow(/alterspec init/);
  });

  it('refreshes framework files but keeps user files', () => {
    const root = tmpProject();
    runInit(root);
    put(root, '.alterspec/templates/capability.md', 'old template');
    put(root, '.alterspec/config.yaml', 'version: "0.0.1"\nlanguage: en\n');
    put(root, 'spec/application/rules.md', 'my rules');

    const result = runUpdate(root);
    expect(result.updated).toEqual(['.alterspec/templates/capability.md']);
    expect(read(root, '.alterspec/templates/capability.md')).toContain('CAP-{{MOD}}-{{NNN}}');
    expect(read(root, '.alterspec/config.yaml')).toBe('version: "0.0.1"\nlanguage: en\n');
    expect(read(root, 'spec/application/rules.md')).toBe('my rules');
  });

  it('skips a wrapper the user modified, unless --force', () => {
    const root = tmpProject();
    runInit(root);
    const wrapper = '.claude/skills/alterspec-create-capability/SKILL.md';
    const original = read(root, wrapper);
    put(root, wrapper, 'my wrapper');

    const result = runUpdate(root);
    expect(result.conflicts).toEqual([wrapper]);
    expect(read(root, wrapper)).toBe('my wrapper');

    // still flagged on the next run
    expect(runUpdate(root).conflicts).toEqual([wrapper]);

    const forced = runUpdate(root, { force: true });
    expect(forced.updated).toEqual([wrapper]);
    expect(read(root, wrapper)).toBe(original);
  });

  it('replaces an unmodified wrapper that a new version changed', () => {
    const root = tmpProject();
    runInit(root);
    const wrapper = '.claude/skills/alterspec-create-capability/SKILL.md';
    // Simulate an older shipped version: file and manifest agree on old content.
    put(root, wrapper, 'old shipped wrapper');
    const manifest = readManifest(root)!;
    manifest.files[wrapper] = sha256('old shipped wrapper');
    writeFileSync(join(root, MANIFEST_PATH), JSON.stringify(manifest));

    expect(runUpdate(root).updated).toEqual([wrapper]);
  });

  it('removes framework files that are no longer shipped, but not modified ones', () => {
    const root = tmpProject();
    runInit(root);
    const manifest = readManifest(root)!;
    put(root, '.alterspec/prompts/obsolete.md', 'old');
    put(root, '.claude/skills/alterspec-gone/SKILL.md', 'changed by user');
    manifest.files['.alterspec/prompts/obsolete.md'] = sha256('old');
    manifest.files['.claude/skills/alterspec-gone/SKILL.md'] = sha256('shipped');
    writeFileSync(join(root, MANIFEST_PATH), JSON.stringify(manifest));

    const result = runUpdate(root);
    expect(result.removed).toEqual(['.alterspec/prompts/obsolete.md']);
    expect(result.conflicts).toEqual(['.claude/skills/alterspec-gone/SKILL.md']);
    expect(existsSync(join(root, '.alterspec/prompts/obsolete.md'))).toBe(false);
  });
});

describe('alterspec doctor', () => {
  it('passes on a fresh install', () => {
    const root = tmpProject();
    runInit(root);
    expect(runDoctor(root).filter((c) => !c.ok)).toEqual([]);
  });

  it('reports a missing install', () => {
    expect(runDoctor(tmpProject()).some((c) => !c.ok && c.message.includes('alterspec init'))).toBe(true);
  });

  it('reports custom prompt overrides that no longer match a shipped prompt', () => {
    const root = tmpProject();
    runInit(root);
    put(root, '.alterspec/custom/prompts/module.md', 'old name');
    put(root, '.alterspec/custom/prompts/create-module.md', 'current name');
    const failed = runDoctor(root)
      .filter((c) => !c.ok)
      .map((c) => c.message);
    expect(failed).toEqual([expect.stringContaining('custom/prompts/module.md overrides no prompt')]);
  });

  it('reports custom template overrides that match no shipped template', () => {
    const root = tmpProject();
    runInit(root);
    put(root, '.alterspec/custom/templates/story.md', 'old name');
    put(root, '.alterspec/custom/templates/capability.md', 'current name');
    const failed = runDoctor(root)
      .filter((c) => !c.ok)
      .map((c) => c.message);
    expect(failed).toEqual([expect.stringContaining('custom/templates/story.md overrides no template')]);
  });

  it('update replaces old alter-* wrappers with alterspec-* ones', () => {
    const root = tmpProject();
    runInit(root);
    const old = '.claude/skills/alter-module/SKILL.md';
    put(root, old, 'old wrapper');
    const manifest = readManifest(root)!;
    manifest.files[old] = sha256('old wrapper');
    writeFileSync(join(root, MANIFEST_PATH), JSON.stringify(manifest));
    const result = runUpdate(root);
    expect(result.removed).toEqual([old]);
    expect(existsSync(join(root, '.claude/skills/alterspec-create-module/SKILL.md'))).toBe(true);
  });

  it('reports modified and missing wrappers, and an invalid config', () => {
    const root = tmpProject();
    runInit(root);
    put(root, '.claude/agents/alterspec-reviewer.md', 'changed');
    rmSync(join(root, '.claude/skills/alterspec-views/SKILL.md'));
    put(root, '.alterspec/config.yaml', 'version: "0.0.1"\nlanguage: sr\n');
    const failed = runDoctor(root)
      .filter((c) => !c.ok)
      .map((c) => c.message);
    expect(failed.some((m) => m.startsWith('Modified .claude/agents/alterspec-reviewer.md'))).toBe(true);
    expect(failed.some((m) => m.startsWith('Missing .claude/skills/alterspec-views/SKILL.md'))).toBe(true);
    expect(failed.some((m) => m.includes('config.yaml is invalid'))).toBe(true);
  });
});
