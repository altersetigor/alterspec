import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runBaseline } from '../src/commands/baseline.js';
import { runChangeEdit, runChangeNew, runChangeStatus } from '../src/commands/change.js';
import { runApply } from '../src/changes/apply.js';
import { runHandoff } from '../src/commands/handoff.js';
import {
  runExperienceInit,
  runExperienceNew,
  runExperienceRebuild,
  runExperienceReviewed,
  runExperienceSync,
} from '../src/commands/experience.js';
import { runValidate } from '../src/commands/validate.js';
import { runInit } from '../src/commands/init.js';
import { runNew } from '../src/commands/new.js';
import { computeImpact } from '../src/changes/impact.js';
import { elementText, tags, withAttr } from '../src/experience/html.js';
import { copyFixture } from './fixture.js';
import { tmpProject } from './helpers.js';

const read = (dir: string, p: string) => readFileSync(join(dir, 'spec', p), 'utf8');
const write = (dir: string, p: string, from: string, to: string) => {
  const full = join(dir, 'spec', p);
  const text = readFileSync(full, 'utf8');
  if (!text.includes(from)) throw new Error(`${p} has no ${from}`);
  writeFileSync(full, text.replace(from, to));
};

describe('experience commands', () => {
  it('init adds the starter once and never overwrites', () => {
    const dir = copyFixture();
    const r = runExperienceInit(dir);
    expect(r.created).toEqual([]);
    expect(r.skipped).toContain('experience/mockups/config.js');
    expect(r.skipped).toContain('experience/patterns.md');
  });

  it('new drafts a screen and mockup that pass every check', () => {
    const dir = copyFixture();
    const r = runExperienceNew(dir, 'SCR-PAY-01');
    expect(r.files).toEqual(['experience/screens/UX-SCR-PAY-01.md', 'experience/mockups/SCR-PAY-01.html']);
    expect(read(dir, 'experience/screens/UX-SCR-PAY-01.md')).toContain('archetype: list');
    const page = read(dir, 'experience/mockups/SCR-PAY-01.html');
    // An application page bound to the demo data: rows from a template, actions that change data.
    expect(page).toContain('data-list');
    expect(page).toContain('<template data-row>');
    expect(page).toMatch(/data-effect="\{&quot;op&quot;:&quot;create&quot;/);
    expect(page).toContain('<script src="kit/app.js"></script>');
    expect(page).not.toMatch(/ux-review|Signed in as|data-states-bar/);
    expect(runValidate(dir).findings).toEqual([]);
    expect(() => runExperienceNew(dir, 'SCR-PAY-01')).toThrow(/already exists/);
    expect(() => runExperienceNew(dir, 'SCR-PAY-09')).toThrow(/not a screen/);
  });

  it('new covers every role of a screen with a default view', () => {
    const dir = copyFixture();
    write(
      dir,
      'modules/pay/screens/SCR-PAY-01.md',
      '  - role: ROLE-ACCOUNTANT\n',
      '  - role: ROLE-ACCOUNTANT\n  - role: ROLE-HR-MANAGER\n',
    );
    runExperienceNew(dir, 'SCR-PAY-01');
    expect(read(dir, 'experience/screens/UX-SCR-PAY-01.md')).toContain('id: default-hr-manager');
    expect(runValidate(dir).findings.filter((f) => f.rule.startsWith('experience-'))).toEqual([]);
  });

  it('new needs init first', () => {
    const dir = copyFixture();
    write(dir, 'experience/patterns.md', '```yaml', '```text');
    expect(runValidate(dir).findings.map((f) => f.rule)).toContain('experience-vocabulary');
  });

  it('reviewed refuses while there are findings, then records the review', () => {
    const dir = copyFixture();
    const mock = 'experience/mockups/SCR-HR-01.html';
    write(dir, mock, '>Activate</button>', '>Enable</button>');
    const bad = runExperienceReviewed(dir, 'SCR-HR-01');
    expect(bad.reviewed).toBeUndefined();
    expect(bad.findings.map((f) => f.rule)).toEqual(['experience-labels']);
    write(dir, mock, '>Enable</button>', '>Activate</button>');
    write(dir, 'experience/screens/UX-SCR-HR-01.md', 'in one column.', 'in one wide column.');
    expect(runValidate(dir).findings.map((f) => f.rule)).toEqual(['experience-unreviewed']);
    expect(runExperienceReviewed(dir, 'SCR-HR-01').reviewed).toMatch(/^[0-9a-f]{12}$/);
    expect(runValidate(dir).findings).toEqual([]);
  });

  it('sync follows a changed business screen', () => {
    const dir = copyFixture();
    write(
      dir,
      'modules/hr/screens/SCR-HR-01.md',
      '    attributes: [Full name, Start date, Contract type]',
      '    attributes: [Full name, Contract type]',
    );
    expect(
      runValidate(dir)
        .findings.map((f) => f.rule)
        .filter((r) => r !== 'views-stale')
        .sort(),
    ).toEqual(['experience-elements', 'experience-mockup', 'experience-stale']);
    const r = runExperienceSync(dir, 'SCR-HR-01');
    expect(r).toMatchObject({ removed: ['SCR-HR-01.ENT-EMPLOYEE.Start date'], added: [] });
    expect(read(dir, 'experience/mockups/SCR-HR-01.html')).not.toContain('Start date');
    expect(
      runValidate(dir)
        .findings.map((f) => f.rule)
        .filter((r) => r !== 'views-stale'),
    ).toEqual(['experience-unreviewed']);
  });

  it('sync adds new elements as drafts to place', () => {
    const dir = copyFixture();
    write(
      dir,
      'modules/hr/screens/SCR-HR-01.md',
      '    attributes: [Full name, Start date, Contract type]',
      '    attributes: [Full name, Start date]',
    );
    runExperienceSync(dir, 'SCR-HR-01');
    write(
      dir,
      'modules/hr/screens/SCR-HR-01.md',
      '    attributes: [Full name, Start date]',
      '    attributes: [Full name, Start date, Contract type]',
    );
    const r = runExperienceSync(dir, 'SCR-HR-01');
    expect(r.added).toEqual(['SCR-HR-01.ENT-EMPLOYEE.Contract type']);
    expect(read(dir, 'experience/mockups/SCR-HR-01.html')).toContain('Added by sync: place these');
  });

  it('sync gives a new screen role its default view and updates who sees each element', () => {
    const dir = copyFixture();
    write(
      dir,
      'modules/hr/screens/SCR-HR-01.md',
      '  - role: ROLE-HR-MANAGER\n',
      '  - role: ROLE-ACCOUNTANT\n  - role: ROLE-HR-MANAGER\n',
    );
    const r = runExperienceSync(dir, 'SCR-HR-01');
    expect(r.states).toEqual(['default-accountant']);
    expect(r.roles).toEqual(['SCR-HR-01.A01', 'SCR-HR-01.A02', 'SCR-HR-01.A03']);
    const page = read(dir, 'experience/mockups/SCR-HR-01.html');
    expect(page).toMatch(/<body[^>]* data-roles="ROLE-ACCOUNTANT ROLE-HR-MANAGER"/);
    expect(page).toMatch(/data-src="SCR-HR-01.A01"[^>]* data-roles="ROLE-HR-MANAGER"/);
    expect(
      runValidate(dir)
        .findings.map((f) => f.rule)
        .filter((r) => r !== 'views-stale'),
    ).toEqual(['experience-unreviewed']);
    // Back to one role: the narrowing goes away again.
    write(dir, 'modules/hr/screens/SCR-HR-01.md', '  - role: ROLE-ACCOUNTANT\n', '');
    expect(runExperienceSync(dir, 'SCR-HR-01').roles).toEqual([
      'SCR-HR-01.A01',
      'SCR-HR-01.A02',
      'SCR-HR-01.A03',
    ]);
    expect(read(dir, 'experience/mockups/SCR-HR-01.html')).not.toMatch(
      /data-src="SCR-HR-01.A01"[^>]* data-roles=/,
    );
  });

  it('rebuild replaces only an untouched draft and records the page fingerprint', () => {
    const dir = copyFixture();
    runExperienceNew(dir, 'SCR-PAY-01');
    expect(read(dir, 'experience/screens/UX-SCR-PAY-01.md')).toMatch(/^page: [0-9a-f]{12}$/m);
    const r = runExperienceRebuild(dir, 'SCR-PAY-01');
    expect(r.kept).toBe(false);
    expect(r.files).toEqual(['experience/mockups/SCR-PAY-01.html', 'experience/screens/UX-SCR-PAY-01.md']);
    expect(runValidate(dir).findings).toEqual([]);
  });

  it('rebuild keeps a hand-edited page, writes the fresh render aside and analyses the difference', () => {
    const dir = copyFixture();
    runExperienceNew(dir, 'SCR-PAY-01');
    const mock = 'experience/mockups/SCR-PAY-01.html';
    write(dir, mock, '<h1 class="ux-page-title">', '<h1 class="ux-page-title ux-big">');
    const design = runExperienceRebuild(dir, 'SCR-PAY-01');
    expect(design).toMatchObject({
      kept: true,
      files: [],
      businessChange: [],
      findings: [],
      kitOutdated: false,
    });
    expect(design.reference).toBe('_generated/experience/rebuild/SCR-PAY-01.html');
    expect(existsSync(join(dir, 'spec', design.reference!))).toBe(true);
    expect(read(dir, mock)).toContain('ux-big');
    expect(runValidate(dir).findings).toEqual([]);

    write(dir, mock, '</main>', '<div data-src="SCR-PAY-01.ENT-PAYSLIP.Discount">Discount</div></main>');
    const business = runExperienceRebuild(dir, 'SCR-PAY-01');
    expect(business.kept).toBe(true);
    expect(business.businessChange).toEqual(['SCR-PAY-01.ENT-PAYSLIP.Discount']);
    expect(business.findings.map((f) => f.rule)).toEqual(['experience-mockup']);
    expect(read(dir, mock)).toContain('Discount');

    const forced = runExperienceRebuild(dir, 'SCR-PAY-01', { force: true });
    expect(forced.kept).toBe(false);
    expect(read(dir, mock)).not.toMatch(/ux-big|Discount/);
  });

  it('rebuild treats a page without a recorded fingerprint as hand-made', () => {
    const dir = copyFixture();
    const before = read(dir, 'experience/mockups/SCR-HR-01.html');
    expect(runExperienceRebuild(dir, 'SCR-HR-01').kept).toBe(true);
    expect(read(dir, 'experience/mockups/SCR-HR-01.html')).toBe(before);
  });

  it('init writes the spec data the pages load; inside a change, a preview copy goes into the overlay', () => {
    const fresh = tmpProject();
    runInit(fresh, { name: 'Demo' });
    runNew(fresh, 'role', { name: 'admin', title: 'Admin' });
    runNew(fresh, 'module', { code: 'HR', title: 'HR' });
    runNew(fresh, 'screen', { module: 'HR', title: 'People' });
    runExperienceInit(fresh);
    expect(existsSync(join(fresh, 'spec/_generated/experience/spec.js'))).toBe(true);

    const dir = copyFixture();
    runBaseline(dir);
    const { id } = runChangeNew(dir, 'Design payslips');
    runExperienceNew(dir, 'SCR-PAY-01', { change: id });
    const preview = join(dir, 'spec/changes', id, 'spec/_generated/experience/spec.js');
    expect(existsSync(preview)).toBe(true);
    expect(computeImpact(dir, id).added.map((o) => o.key)).toEqual([
      'UX-SCR-PAY-01',
      'file:experience/mockups/SCR-PAY-01.html',
    ]);
  });

  it('after the baseline, works only inside a change, and change edit takes the mockup along', () => {
    const dir = copyFixture();
    runBaseline(dir);
    expect(() => runExperienceSync(dir, 'SCR-HR-01')).toThrow(/--change/);
    const { id } = runChangeNew(dir, 'Wording');
    runChangeEdit(dir, id, 'UX-SCR-HR-01');
    expect(existsSync(join(dir, 'spec/changes', id, 'spec/experience/mockups/SCR-HR-01.html'))).toBe(true);
    runExperienceNew(dir, 'SCR-PAY-01', { change: id });
    expect(read(dir, `changes/${id}/proposal.md`)).toContain('UX-SCR-PAY-01: null');
    expect(existsSync(join(dir, 'spec/experience/screens/UX-SCR-PAY-01.md'))).toBe(false);
  });
});

describe('binary mockup assets', () => {
  it('a photo survives a change proposal, apply and handoff byte for byte', () => {
    const dir = copyFixture();
    const bytes = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
    const photo = join(dir, 'spec/experience/mockups/assets/photo.png');
    mkdirSync(dirname(photo), { recursive: true });
    writeFileSync(photo, bytes);
    runBaseline(dir);
    const { id } = runChangeNew(dir, 'New photo');
    runChangeEdit(dir, id, 'file:experience/mockups/assets/photo.png');
    const overlay = join(dir, 'spec/changes', id, 'spec/experience/mockups/assets/photo.png');
    expect(readFileSync(overlay)).toEqual(bytes);
    const changed = Buffer.from(bytes).reverse();
    writeFileSync(overlay, changed);
    runChangeStatus(dir, id, 'in_review');
    runChangeStatus(dir, id, 'approved');
    runApply(dir, id);
    expect(readFileSync(photo)).toEqual(changed);
    expect(runValidate(dir).findings).toEqual([]);
    const r = runHandoff(dir, 'CAP-HR-001', { date: '2026-10-07' });
    expect(readFileSync(join(dir, r.outputs[0]!.folder, 'experience/mockups/assets/photo.png'))).toEqual(
      changed,
    );
  });
});

describe('mockup reader', () => {
  it('finds elements, their attributes and their text', () => {
    const html =
      '<main data-src="S"><!-- <b data-src="X"> --><div data-src="A" data-roles="R1 R2"><div><span>Hello</span> world</div></div>' +
      '<input data-src="B" value="Typed"><script>var s = "<div data-src=\\"Y\\">";</script></main>';
    const t = tags(html);
    expect(t.filter((x) => x.attrs['data-src']).map((x) => x.attrs['data-src'])).toEqual(['S', 'A', 'B']);
    const a = t.find((x) => x.attrs['data-src'] === 'A')!;
    expect(a.attrs['data-roles']).toBe('R1 R2');
    expect(elementText(html, a)).toBe('Hello world');
    expect(
      elementText(
        html,
        t.find((x) => x.attrs['data-src'] === 'B')!,
      ),
    ).toBe('Typed');
  });

  it('sets, replaces and removes an attribute on an opening tag', () => {
    const html = '<div data-src="A" data-roles="R1">x</div><input data-src="B">';
    const a = () => tags(html).find((x) => x.attrs['data-src'] === 'A')!;
    expect(withAttr(html, a(), 'data-roles', 'R2 R3')).toContain('<div data-src="A" data-roles="R2 R3">');
    expect(withAttr(html, a(), 'data-roles', undefined)).toContain('<div data-src="A">');
    const b = tags(html).find((x) => x.attrs['data-src'] === 'B')!;
    expect(withAttr(html, b, 'data-roles', 'R1')).toContain('<input data-src="B" data-roles="R1">');
  });
});
