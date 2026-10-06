import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ASSETS_DIR } from '../src/assets.js';
import { parseFrontMatter } from '../src/lib/frontmatter.js';
import { issues, readAsset } from './helpers.js';

const COMMANDS = [
  'init',
  'module',
  'capability',
  'screen',
  'entity',
  'refine',
  'validate',
  'views',
  'change',
  'impact',
  'apply',
  'handoff',
];

const SkillFrontMatter = z
  .object({
    name: z.string().regex(/^alter-[a-z]+$/),
    description: z.string().min(20),
    'argument-hint': z.string().optional(),
    'disable-model-invocation': z.boolean().optional(),
    'allowed-tools': z.string().min(1),
  })
  .strict();

const AgentFrontMatter = z
  .object({
    name: z.string().regex(/^alter-[a-z]+$/),
    description: z.string().min(20),
    tools: z.string().min(1),
  })
  .strict();

describe('skill wrappers', () => {
  const dirs = readdirSync(join(ASSETS_DIR, 'claude/skills'));

  it('ships exactly the 12 alter-* skills', () => {
    expect(dirs.sort()).toEqual(COMMANDS.map((c) => `alter-${c}`).sort());
  });

  for (const cmd of COMMANDS) {
    it(`alter-${cmd} is a valid thin wrapper`, () => {
      const src = readAsset(`claude/skills/alter-${cmd}/SKILL.md`);
      const { data, body } = parseFrontMatter(src);
      expect(issues(SkillFrontMatter.safeParse(data))).toEqual([]);
      expect((data as { name: string }).name).toBe(`alter-${cmd}`);
      expect(body).toContain(`.alterspec/prompts/${cmd}.md`);
      expect(body).toContain(`.alterspec/custom/prompts/${cmd}.md`);
      expect(body).toContain('$ARGUMENTS');
      expect(existsSync(join(ASSETS_DIR, 'prompts', `${cmd}.md`)), `prompts/${cmd}.md`).toBe(true);
    });
  }

  it('only lets the model invoke read-only commands', () => {
    const modelInvocable = COMMANDS.filter(
      (c) =>
        !(parseFrontMatter(readAsset(`claude/skills/alter-${c}/SKILL.md`)).data as Record<string, unknown>)[
          'disable-model-invocation'
        ],
    );
    expect(modelInvocable.sort()).toEqual(['impact', 'validate', 'views']);
  });

  it('never pre-approves the unscoped `npx alterspec` package', () => {
    for (const cmd of COMMANDS) {
      expect(readAsset(`claude/skills/alter-${cmd}/SKILL.md`)).not.toMatch(/npx alterspec/);
    }
  });
});

describe('agent wrappers', () => {
  for (const agent of ['analyst', 'reviewer']) {
    it(`alter-${agent} is a valid thin wrapper`, () => {
      const { data, body } = parseFrontMatter(readAsset(`claude/agents/alter-${agent}.md`));
      expect(issues(AgentFrontMatter.safeParse(data))).toEqual([]);
      expect((data as { name: string }).name).toBe(`alter-${agent}`);
      expect(body).toContain(`.alterspec/prompts/agents/${agent}.md`);
      expect(existsSync(join(ASSETS_DIR, 'prompts/agents', `${agent}.md`))).toBe(true);
    });
  }

  it('the reviewer cannot write files', () => {
    const { data } = parseFrontMatter(readAsset('claude/agents/alter-reviewer.md'));
    expect((data as { tools: string }).tools).not.toMatch(/Write|Edit/);
  });
});
