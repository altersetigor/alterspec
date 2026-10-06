import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
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
    const r = run(['validate']);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/not available yet/);
  });

  it('update without init fails cleanly', () => {
    const r = run(['update', tmpProject()]);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/alterspec init/);
  });
});
