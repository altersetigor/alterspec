import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ASSETS_DIR } from '../src/assets.js';
import { NEW_TYPES } from '../src/commands/new.js';
import { parseFrontMatter } from '../src/lib/frontmatter.js';
import { issues, readAsset } from './helpers.js';

const COMMANDS = [
  'alterspec',
  'groom',
  'init',
  'validate',
  'views',
  'impact',
  'apply',
  'handoff',
  'experience',
];

/** The references grooming reads for each object type and for an empty spec; not skills. */
const REFERENCES = ['_shared', '_skeleton', '_module', '_entity', '_capability', '_screen'];

const SkillFrontMatter = z
  .object({
    name: z.string().regex(/^alterspec(-[a-z-]+)?$/),
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

  /** The skill directory of a command: `alterspec-<cmd>`, except the front door, which is `alterspec` itself. */
  const skillOf = (cmd: string) => (cmd === 'alterspec' ? 'alterspec' : `alterspec-${cmd}`);

  it('ships exactly the 9 skills: the front door, grooming, init, the checks, the gates and experience', () => {
    expect(dirs.sort()).toEqual(COMMANDS.map(skillOf).sort());
  });

  for (const cmd of COMMANDS) {
    it(`${skillOf(cmd)} is a valid thin wrapper`, () => {
      const src = readAsset(`claude/skills/${skillOf(cmd)}/SKILL.md`);
      const { data, body } = parseFrontMatter(src);
      expect(issues(SkillFrontMatter.safeParse(data))).toEqual([]);
      expect((data as { name: string }).name).toBe(skillOf(cmd));
      expect(body).toContain(`.alterspec/prompts/${cmd}.md`);
      expect(body).toContain(`.alterspec/custom/prompts/${cmd}.md`);
      expect(body).toContain('$ARGUMENTS');
      expect(existsSync(join(ASSETS_DIR, 'prompts', `${cmd}.md`)), `prompts/${cmd}.md`).toBe(true);
    });
  }

  const frontMatterOf = (cmd: string) =>
    parseFrontMatter(readAsset(`claude/skills/${skillOf(cmd)}/SKILL.md`)).data as Record<string, unknown>;

  it("keeps init, apply and handoff out of the model's hands; every other skill may start from plain language", () => {
    const manual = COMMANDS.filter((c) => frontMatterOf(c)['disable-model-invocation']);
    expect(manual.sort()).toEqual(['apply', 'handoff', 'init']);
  });

  it('describes every model-invocable skill as a trigger: when to use it, with an example', () => {
    for (const cmd of COMMANDS) {
      if (frontMatterOf(cmd)['disable-model-invocation']) continue;
      const description = frontMatterOf(cmd).description as string;
      expect(description.length, `${skillOf(cmd)} description`).toBeGreaterThanOrEqual(60);
      expect(description, `${skillOf(cmd)} description`).toMatch(/Use when|Use for|Regenerate/);
    }
  });

  it('the front door names every skill it can route to, and none it must not start', () => {
    const prompt = readAsset('prompts/alterspec.md');
    for (const cmd of COMMANDS) {
      if (cmd === 'alterspec') continue;
      expect(prompt, `prompts/alterspec.md mentions ${skillOf(cmd)}`).toContain(skillOf(cmd));
    }
    for (const manual of ['init', 'apply', 'handoff'])
      expect(prompt).toMatch(new RegExp(`never invoke[^.]*\`alterspec-${manual}\``));
  });

  it('never pre-approves the unscoped `npx alterspec` package', () => {
    for (const cmd of COMMANDS) {
      expect(readAsset(`claude/skills/${skillOf(cmd)}/SKILL.md`)).not.toMatch(/npx alterspec/);
    }
  });

  it('grooming is the one way in: no wrapper or prompt names a single-object skill of 0.7', () => {
    const removed = /alterspec-(create|change)-\w+|\/alterspec-refine|\/alterspec-change\b/;
    for (const cmd of COMMANDS)
      expect(readAsset(`claude/skills/${skillOf(cmd)}/SKILL.md`), skillOf(cmd)).not.toMatch(removed);
    for (const p of readdirSync(join(ASSETS_DIR, 'prompts'), { recursive: true }).map(String))
      if (p.endsWith('.md')) expect(readAsset(`prompts/${p}`), p).not.toMatch(removed);
    const groom = readAsset('prompts/groom.md');
    for (const ref of REFERENCES) {
      expect(existsSync(join(ASSETS_DIR, 'prompts', `${ref}.md`)), ref).toBe(true);
      expect(groom, `groom.md reads ${ref}.md`).toContain(`${ref}.md`);
    }
    expect(readAsset('prompts/init.md')).toContain('groom.md');
  });
});

describe('agent wrappers', () => {
  for (const agent of ['analyst', 'reviewer', 'ux-designer', 'experience-reviewer']) {
    it(`alterspec-${agent} is a valid thin wrapper`, () => {
      const { data, body } = parseFrontMatter(readAsset(`claude/agents/alterspec-${agent}.md`));
      expect(issues(AgentFrontMatter.safeParse(data))).toEqual([]);
      expect((data as { name: string }).name).toBe(`alterspec-${agent}`);
      expect(body).toContain(`.alterspec/prompts/agents/${agent}.md`);
      expect(existsSync(join(ASSETS_DIR, 'prompts/agents', `${agent}.md`))).toBe(true);
    });
  }

  it('the analyst has its three modes: gap analysis, draft, proposal (grooming)', () => {
    const prompt = readAsset('prompts/agents/analyst.md');
    for (const mode of ['## Gap analysis mode', '## Draft mode', '## Proposal mode'])
      expect(prompt).toContain(mode);
    expect(prompt).toMatch(/\(proposed\)/);
  });

  it('the analyst can run the CLI; the reviewer cannot write files', () => {
    expect(
      (parseFrontMatter(readAsset('claude/agents/alterspec-analyst.md')).data as { tools: string }).tools,
    ).toContain('Bash');
    for (const reviewer of ['reviewer', 'experience-reviewer']) {
      const { data } = parseFrontMatter(readAsset(`claude/agents/alterspec-${reviewer}.md`));
      expect((data as { tools: string }).tools).not.toMatch(/Write|Edit/);
    }
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
    'experience',
    'profile',
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
