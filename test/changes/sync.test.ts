import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runBaseline } from '../../src/commands/baseline.js';
import { runChangeSync } from '../../src/commands/change-sync.js';
import { runChangeEdit, runChangeNew, runChangeRemove, runChangeStatus } from '../../src/commands/change.js';
import { computeImpact, formatImpact } from '../../src/changes/impact.js';
import { dryHash, dryPage } from '../../src/experience/index.js';
import { readSpecDir } from '../../src/spec/files.js';
import { loadSpec } from '../../src/spec/load.js';
import { parseFrontMatter } from '../../src/lib/frontmatter.js';
import { copyFixture } from '../fixture.js';
import { edit, overlay, read } from './helpers.js';

const HR_SCREEN = 'modules/hr/screens/SCR-HR-01.md';
const PAY_SCREEN = 'modules/pay/screens/SCR-PAY-01.md';
const EMPLOYEE = 'application/entities/ENT-EMPLOYEE.md';

/** A fixture copy with a baseline and an empty open change. */
function project(): { dir: string; id: string } {
  const dir = copyFixture();
  runBaseline(dir);
  const { id } = runChangeNew(dir, 'Follow the experience');
  return { dir, id };
}

const dryOf = (dir: string, chg: string, screen: string) => {
  const files = readSpecDir(join(dir, 'spec'));
  const overlayFiles = readSpecDir(join(dir, 'spec/changes', chg, 'spec'));
  const merged = [...files.filter((f) => !overlayFiles.some((o) => o.path === f.path)), ...overlayFiles];
  const page = dryPage(loadSpec(merged).model, screen);
  return page ? dryHash(page) : undefined;
};

describe('change sync', () => {
  it('re-aligns a stale experience screen inside the change, and the review gate asks for it first', () => {
    const { dir, id } = project();
    runChangeEdit(dir, id, 'SCR-HR-01');
    edit(dir, overlay(id, HR_SCREEN), 'title: Employee record', 'title: Employee record and history');

    const before = computeImpact(dir, id);
    expect(before.experience.stale).toEqual(['SCR-HR-01']);
    expect(formatImpact(before)).toContain('to align: SCR-HR-01');
    expect(() => runChangeStatus(dir, id, 'in_review')).toThrow(
      /SCR-HR-01 changed since.*alterspec change sync/,
    );

    const r = runChangeSync(dir, id);
    expect(r.synced.map((s) => s.screen)).toEqual(['SCR-HR-01']);
    expect(r.toReview).toEqual(['UX-SCR-HR-01']);
    const doc = read(dir, overlay(id, 'experience/screens/UX-SCR-HR-01.md'));
    expect((parseFrontMatter(doc).data as { dry: string }).dry).toBe(dryOf(dir, id, 'SCR-HR-01'));
    expect(existsSync(join(dir, overlay(id, 'experience/mockups/SCR-HR-01.html')))).toBe(true);
    expect(computeImpact(dir, id).experience.stale).toEqual([]);
    expect(runChangeStatus(dir, id, 'in_review').status).toBe('in_review');
  });

  it('picks up a screen outside the change whose entity changed, and copies it in', () => {
    const { dir, id } = project();
    runChangeEdit(dir, id, 'ENT-EMPLOYEE');
    // Contract type is shown on SCR-HR-01; its options are part of what the experience screen realises.
    edit(
      dir,
      overlay(id, EMPLOYEE),
      'options: [Permanent, Fixed term]',
      'options: [Permanent, Fixed term, Intern]',
    );
    expect(computeImpact(dir, id).experience.stale).toEqual(['SCR-HR-01']);
    const r = runChangeSync(dir, id);
    expect(r.synced.map((s) => s.screen)).toEqual(['SCR-HR-01']);
    expect(read(dir, `spec/changes/${id}/proposal.md`)).toContain('UX-SCR-HR-01:');
  });

  it('drafts the first experience screen of a screen the change touches', () => {
    const { dir, id } = project();
    runChangeEdit(dir, id, 'SCR-PAY-01');
    edit(dir, overlay(id, PAY_SCREEN), 'status: draft', 'status: refined');
    expect(computeImpact(dir, id).experience.missing).toEqual(['SCR-PAY-01']);
    const r = runChangeSync(dir, id);
    expect(r.drafted).toEqual(['SCR-PAY-01']);
    expect(existsSync(join(dir, overlay(id, 'experience/screens/UX-SCR-PAY-01.md')))).toBe(true);
    expect(existsSync(join(dir, overlay(id, 'experience/mockups/SCR-PAY-01.html')))).toBe(true);
    expect(existsSync(join(dir, 'spec/experience/screens/UX-SCR-PAY-01.md'))).toBe(false);
    expect(runChangeSync(dir, id).drafted).toEqual([]);
  });

  it('a draft screen without an experience does not block the review; a ready one does', () => {
    const { dir, id } = project();
    runChangeEdit(dir, id, 'SCR-PAY-01');
    edit(dir, overlay(id, PAY_SCREEN), 'title: Payslip run', 'title: Payslip run and review');
    expect(runChangeStatus(dir, id, 'in_review').status).toBe('in_review');
    runChangeStatus(dir, id, 'draft');
    edit(dir, overlay(id, PAY_SCREEN), 'status: draft', 'status: ready');
    expect(() => runChangeStatus(dir, id, 'in_review')).toThrow(/SCR-PAY-01 has no experience screen/);
  });

  it('records the removal of the experience of a removed screen', () => {
    const { dir, id } = project();
    runChangeRemove(dir, id, 'SCR-HR-01');
    expect(computeImpact(dir, id).experience.orphaned).toEqual(['UX-SCR-HR-01']);
    const r = runChangeSync(dir, id);
    expect(r.removed).toEqual(['UX-SCR-HR-01']);
    const proposal = read(dir, `spec/changes/${id}/proposal.md`);
    expect(proposal).toContain('- UX-SCR-HR-01');
    expect(proposal).toContain('- file:experience/mockups/SCR-HR-01.html');
    expect(computeImpact(dir, id).experience.orphaned).toEqual([]);
  });

  it('does nothing without an experience layer', () => {
    const { dir, id } = project();
    rmSync(join(dir, 'spec/experience'), { recursive: true });
    runChangeEdit(dir, id, 'SCR-HR-01');
    edit(dir, overlay(id, HR_SCREEN), 'title: Employee record', 'title: Employee file');
    const r = runChangeSync(dir, id);
    expect(r.skipped).toBe('no experience layer');
    expect(readFileSync(join(dir, `spec/changes/${id}/proposal.md`), 'utf8')).not.toContain('UX-');
  });
});
