import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { copyFixture } from './fixture.js';
import { tmpProject } from './helpers.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(ROOT, 'dist/cli.js');

const run = (args: string[]) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });

describe('built CLI', () => {
  beforeAll(() => {
    execFileSync('npx', ['tsup'], { cwd: ROOT, stdio: 'ignore' });
  }, 60_000);

  it('init → init → update → doctor', () => {
    const dir = tmpProject();
    const first = run(['init', dir, '--name', 'Demo']);
    expect(first.status, first.stderr).toBe(0);
    expect(first.stdout).toMatch(/created: \d+/);
    expect(existsSync(join(dir, '.claude/skills/alter-init/SKILL.md'))).toBe(true);

    const second = run(['init', dir]);
    expect(second.status).toBe(0);
    expect(second.stdout).not.toMatch(/created:/);

    expect(run(['update', dir]).status).toBe(0);
    const doctor = run(['doctor', dir]);
    expect(doctor.status, doctor.stdout).toBe(0);
  });

  it('prints the version', () => {
    expect(run(['--version']).stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('planned commands exit with code 2', () => {
    const r = run(['impact', 'CHG-001']);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/not available yet/);
  });

  it('update without init fails cleanly', () => {
    const r = run(['update', tmpProject()]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/alterspec init/);
  });

  it('validate --json on the valid fixture: exit 0, no findings', () => {
    const r = run(['validate', copyFixture(), '--json']);
    expect(r.status, r.stderr).toBe(0);
    const out = JSON.parse(r.stdout) as {
      summary: { errors: number; warnings: number };
      findings: unknown[];
    };
    expect(out.summary).toEqual({ errors: 0, warnings: 0 });
    expect(out.findings).toEqual([]);
  });

  it('validate on a broken spec: exit 1 with file:line', () => {
    const dir = copyFixture();
    const file = join(dir, 'spec/modules/hr/capabilities/CAP-HR-002.md');
    writeFileSync(file, readFileSync(file, 'utf8').replace('rules: []', 'rules: [RULE-999]'));
    const r = run(['validate', dir]);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(
      /spec\/modules\/hr\/capabilities\/CAP-HR-002\.md\n\s+15\s+error\s+unknown-reference/,
    );
  });

  it('views --check: 0 when up to date, 1 when stale; views fixes it', () => {
    const dir = copyFixture();
    expect(run(['views', dir, '--check']).status).toBe(0);
    const file = join(dir, 'spec/modules/hr/capabilities/CAP-HR-001.md');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace('title: Register employee', 'title: Register new employee'),
    );
    const stale = run(['views', dir, '--check']);
    expect(stale.status).toBe(1);
    expect(stale.stdout).toMatch(/spec\/modules\/hr\/module\.md/);
    expect(run(['views', dir]).status).toBe(0);
    expect(run(['views', dir, '--check']).status).toBe(0);
  });

  it('validate --list-rules', () => {
    const r = run(['validate', '--list-rules']);
    expect(r.stdout).toMatch(/unknown-reference\s+error/);
  });
});
