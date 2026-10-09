import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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
    expect(existsSync(join(dir, '.claude/skills/alterspec-init/SKILL.md'))).toBe(true);
    expect(readdirSync(join(dir, '.claude/skills'))).toHaveLength(9);

    const second = run(['init', dir]);
    expect(second.status).toBe(0);
    expect(second.stdout).not.toMatch(/created:/);

    expect(run(['update', dir]).status).toBe(0);
    const doctor = run(['doctor', dir]);
    expect(doctor.status, doctor.stdout).toBe(0);
  });

  it('lists experience lift', () => {
    const r = run(['experience', '--help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/lift \[options\] <SCR>/);
  });

  it('prints the version', () => {
    expect(run(['--version']).stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
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

  it('new --json → show --json → validate', () => {
    const dir = copyFixture();
    const created = run([
      'new',
      'capability',
      '-C',
      dir,
      '--module',
      'PAY',
      '--title',
      'Correct payslip',
      '--role',
      'ACCOUNTANT',
      '--scope',
      'org',
      '--json',
    ]);
    expect(created.status, created.stderr).toBe(0);
    expect(JSON.parse(created.stdout)).toEqual({
      id: 'CAP-PAY-003',
      file: 'spec/modules/pay/capabilities/CAP-PAY-003.md',
      line: 1,
    });
    const shown = run(['show', 'CAP-PAY-003', '-C', dir, '--json']);
    expect(JSON.parse(shown.stdout).references.map((r: { id: string }) => r.id)).toEqual([
      'MOD-PAY',
      'ROLE-ACCOUNTANT',
    ]);
    expect(run(['validate', dir]).status).toBe(0);
  });

  it('new with missing options fails with a clear message', () => {
    const r = run(['new', 'capability', '-C', copyFixture(), '--module', 'PAY']);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/needs --title, --role/);
  });

  it('baseline → change → impact → approve → apply', () => {
    const dir = copyFixture();
    const ok = (args: string[]) => {
      const r = run(args);
      expect(r.status, `${args.join(' ')}\n${r.stdout}\n${r.stderr}`).toBe(0);
      return r.stdout;
    };
    ok(['baseline', '-C', dir]);
    const created = JSON.parse(ok(['change', 'new', '-C', dir, '--title', 'Probation', '--groom', '--json']));
    expect(created.id).toBe('CHG-001');
    expect(created.groom).toBe('spec/changes/CHG-001/groom.md');
    ok(['change', 'edit', 'CHG-001', 'CAP-HR-002', '-C', dir]);
    const file = join(dir, 'spec/changes/CHG-001/spec/modules/hr/capabilities/CAP-HR-002.md');
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace(
        'title: Activate employee',
        'title: Activate employee after probation',
      ),
    );
    expect(JSON.parse(ok(['impact', 'CHG-001', '-C', dir, '--json'])).modified[0].fields).toEqual(['title']);
    ok(['validate', dir, '--change', 'CHG-001']);
    expect(run(['apply', 'CHG-001', '-C', dir]).status).toBe(1);
    ok(['change', 'status', 'CHG-001', 'in_review', '-C', dir]);
    ok(['change', 'status', 'CHG-001', 'approved', '-C', dir]);
    expect(ok(['apply', 'CHG-001', '-C', dir])).toMatch(/CAP-HR-002 is now version 2/);
    expect(JSON.parse(ok(['validate', dir, '--json'])).findings).toEqual([]);
  });
});
