import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runHandoff } from '../../src/commands/handoff.js';
import { copyFixture } from '../fixture.js';

const edit = (dir: string, p: string, from: string, to: string) => {
  const full = join(dir, 'spec', p);
  const text = readFileSync(full, 'utf8');
  if (!text.includes(from)) throw new Error(`${p} has no ${from}`);
  writeFileSync(full, text.replace(from, to));
};
const MOCK = 'experience/mockups/SCR-HR-01.html';
const UX = 'experience/screens/UX-SCR-HR-01.md';

describe('handoff experience gate', () => {
  it('hands off aligned screens with their experience contracts and mockups', () => {
    const dir = copyFixture();
    const r = runHandoff(dir, 'CAP-HR-001', { date: '2026-10-07' });
    const files = r.outputs[0]!.files;
    expect(files).toContain('experience/screens/UX-SCR-HR-01.md');
    expect(files).toContain('experience/mockups/SCR-HR-01.html');
    expect(files).toContain('experience/mockups/kit/components.css');
    expect(files.some((f) => f.includes('SCR-PAY-01'))).toBe(false);
    const folder = join(dir, r.outputs[0]!.folder);
    expect(readFileSync(join(folder, 'README.md'), 'utf8')).toContain(
      '**Experience (ready):** editor layout',
    );
    expect(readFileSync(join(folder, 'experience/mockups/config.js'), 'utf8')).toContain(
      '"nav": [\n    "SCR-HR-01"\n  ]',
    );
    const bundle = JSON.parse(readFileSync(join(folder, 'bundle.json'), 'utf8')) as {
      screens: { experience?: { id: string } }[];
      sources: { id: string }[];
    };
    expect(bundle.screens[0]!.experience?.id).toBe('UX-SCR-HR-01');
    expect(bundle.sources.map((s) => s.id)).toContain('UX-SCR-HR-01');
  });

  it('refuses when the mockup drops an element', () => {
    const dir = copyFixture();
    edit(dir, MOCK, 'data-src="SCR-HR-01.A02" ', '');
    expect(() => runHandoff(dir, 'CAP-HR-001')).toThrow(/UX-SCR-HR-01 experience-mockup/);
  });

  it('refuses when a label differs', () => {
    const dir = copyFixture();
    edit(dir, MOCK, '>Activate</button>', '>Enable</button>');
    expect(() => runHandoff(dir, 'CAP-HR-001')).toThrow(/experience-labels/);
  });

  it('refuses an experience screen edited since its review', () => {
    const dir = copyFixture();
    edit(dir, UX, 'in one column.', 'in two columns.');
    expect(() => runHandoff(dir, 'CAP-HR-001')).toThrow(/experience-unreviewed/);
  });

  it('refuses an experience screen that is not ready, even with --allow-draft', () => {
    const dir = copyFixture();
    edit(dir, UX, 'status: ready', 'status: refined');
    expect(() => runHandoff(dir, 'CAP-HR-001', { allowDraft: true })).toThrow(/UX-SCR-HR-01 is refined/);
  });

  it('refuses screens without an experience screen', () => {
    const dir = copyFixture();
    expect(() => runHandoff(dir, 'MOD-PAY', { allowDraft: true })).toThrow(
      /SCR-PAY-01 has no experience screen/,
    );
  });
});
