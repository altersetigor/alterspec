import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ASSETS_DIR } from '../src/assets.js';
import { NEW_TYPES } from '../src/commands/new.js';
import { parseFrontMatter } from '../src/lib/frontmatter.js';
import { issues, readAsset } from './helpers.js';

const COMMANDS = [
  'init',
  'create-module',
  'create-capability',
  'create-screen',
  'create-entity',
  'change-module',
  'change-capability',
  'change-screen',
  'change-entity',
  'refine',
  'validate',
  'views',
  'change',
  'impact',
  'apply',
  'handoff',
  'prototype',
];

const SkillFrontMatter = z
  .object({
    name: z.string().regex(/^alterspec-[a-z-]+$/),
    description: z.string().min(20),
    'argument-hint': z.string().optional(),
    'disable-model-invocation': z.boolean().optional(),
    'allowed-tools': z.string().min(1),
  })
  .strict();

const AgentFrontMatter = z
  .object({
    name: z.string().regex(/^alterspec-[a-z-]+$/),
    description: z.string().min(20),
    tools: z.string().min(1),
  })
  .strict();

describe('skill wrappers', () => {
  const dirs = readdirSync(join(ASSETS_DIR, 'claude/skills'));

  it('ships exactly the 17 alterspec-* skills', () => {
    expect(dirs.sort()).toEqual(COMMANDS.map((c) => `alterspec-${c}`).sort());
  });

  for (const cmd of COMMANDS) {
    it(`alterspec-${cmd} is a valid thin wrapper`, () => {
      const src = readAsset(`claude/skills/alterspec-${cmd}/SKILL.md`);
      const { data, body } = parseFrontMatter(src);
      expect(issues(SkillFrontMatter.safeParse(data))).toEqual([]);
      expect((data as { name: string }).name).toBe(`alterspec-${cmd}`);
      expect(body).toContain(`.alterspec/prompts/${cmd}.md`);
      expect(body).toContain(`.alterspec/custom/prompts/${cmd}.md`);
      expect(body).toContain('$ARGUMENTS');
      expect(existsSync(join(ASSETS_DIR, 'prompts', `${cmd}.md`)), `prompts/${cmd}.md`).toBe(true);
    });
  }

  it('only lets the model invoke read-only commands', () => {
    const modelInvocable = COMMANDS.filter(
      (c) =>
        !(
          parseFrontMatter(readAsset(`claude/skills/alterspec-${c}/SKILL.md`)).data as Record<string, unknown>
        )['disable-model-invocation'],
    );
    expect(modelInvocable.sort()).toEqual(['impact', 'validate', 'views']);
  });

  it('never pre-approves the unscoped `npx alterspec` package', () => {
    for (const cmd of COMMANDS) {
      expect(readAsset(`claude/skills/alterspec-${cmd}/SKILL.md`)).not.toMatch(/npx alterspec/);
    }
  });
});

describe('agent wrappers', () => {
  for (const agent of ['analyst', 'reviewer']) {
    it(`alterspec-${agent} is a valid thin wrapper`, () => {
      const { data, body } = parseFrontMatter(readAsset(`claude/agents/alterspec-${agent}.md`));
      expect(issues(AgentFrontMatter.safeParse(data))).toEqual([]);
      expect((data as { name: string }).name).toBe(`alterspec-${agent}`);
      expect(body).toContain(`.alterspec/prompts/agents/${agent}.md`);
      expect(existsSync(join(ASSETS_DIR, 'prompts/agents', `${agent}.md`))).toBe(true);
    });
  }

  it('the analyst can run the CLI; the reviewer cannot write files', () => {
    expect(
      (parseFrontMatter(readAsset('claude/agents/alterspec-analyst.md')).data as { tools: string }).tools,
    ).toContain('Bash');
    const { data } = parseFrontMatter(readAsset('claude/agents/alterspec-reviewer.md'));
    expect((data as { tools: string }).tools).not.toMatch(/Write|Edit/);
  });
});

describe('prompts', () => {
  const prompts = readdirSync(join(ASSETS_DIR, 'prompts'), { recursive: true })
    .map(String)
    .filter((p) => p.endsWith('.md'));
  const CLI_COMMANDS = [
    'init',
    'update',
    'doctor',
    'validate',
    'views',
    'new',
    'show',
    'impact',
    'apply',
    'baseline',
    'change',
    'handoff',
    'prototype',
  ];

  it('only mention real CLI commands and `new` types', () => {
    for (const p of prompts) {
      const text = readAsset(`prompts/${p}`);
      for (const m of text.matchAll(/(?:`|npx @alterset\/)alterspec (\w+)(?: (\w+))?/g)) {
        expect(CLI_COMMANDS, `${p}: alterspec ${m[1]}`).toContain(m[1]);
        if (m[1] === 'new' && m[2] && !['type'].includes(m[2]))
          expect(NEW_TYPES as readonly string[], `${p}: new ${m[2]}`).toContain(m[2]);
      }
    }
  });

  it('only mention templates that exist', () => {
    const templates = readdirSync(join(ASSETS_DIR, 'templates'));
    for (const p of prompts) {
      for (const m of readAsset(`prompts/${p}`).matchAll(/`([\w-]+\.md)` template/g)) {
        expect(templates, `${p}: ${m[1]}`).toContain(m[1]);
      }
    }
  });

  it('every command and both agents have real prompts', () => {
    for (const p of [...COMMANDS.map((c) => `${c}.md`), 'agents/analyst.md', 'agents/reviewer.md']) {
      expect(readAsset(`prompts/${p}`), p).not.toMatch(/not available yet/);
      expect(readAsset(`prompts/${p}`).length, p).toBeGreaterThan(400);
    }
  });

  it('never tell the agent to run the unscoped package', () => {
    for (const p of prompts) expect(readAsset(`prompts/${p}`), p).not.toMatch(/npx alterspec/);
  });
});
