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
  runExperienceReviewed,
  runExperienceSync,
} from '../src/commands/experience.js';
import { runValidate } from '../src/commands/validate.js';
import { elementText, tags } from '../src/experience/html.js';
import { copyFixture } from './fixture.js';

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
});
