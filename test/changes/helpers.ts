import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runBaseline } from '../../src/commands/baseline.js';
import { runChangeEdit, runChangeNew } from '../../src/commands/change.js';
import { copyFixture } from '../fixture.js';

export const read = (dir: string, p: string) => readFileSync(join(dir, p), 'utf8');
export const edit = (dir: string, p: string, from: string, to: string) => {
  const text = read(dir, p);
  if (!text.includes(from)) throw new Error(`"${from}" not in ${p}`);
  writeFileSync(join(dir, p), text.replace(from, to));
};

export const HR2 = 'modules/hr/capabilities/CAP-HR-002.md';
export const overlay = (chg: string, p: string) => `spec/changes/${chg}/spec/${p}`;

/** A fixture copy with a baseline and an open change that retitles CAP-HR-002. */
export function projectWithChange(): { dir: string; id: string } {
  const dir = copyFixture();
  runBaseline(dir);
  const { id } = runChangeNew(dir, 'Probation period');
  runChangeEdit(dir, id, 'CAP-HR-002');
  edit(dir, overlay(id, HR2), 'title: Activate employee', 'title: Activate employee after probation');
  return { dir, id };
}
