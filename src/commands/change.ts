import { idKind } from '../schemas/ids.js';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { ASSETS_DIR } from '../assets.js';
import { nextNumber } from '../authoring/ids.js';
import { today } from '../changes/baseline.js';
import { ChangeError, changeHash, loadChange, updateProposal, type LoadedChange } from '../changes/change.js';
import { fingerprint, specObjects } from '../changes/fingerprint.js';
import { overlayObjects, removeItem, upsertItem } from '../changes/merge.js';
import { renderTemplate } from '../lib/template.js';
import { ChangeStatus } from '../schemas/change.js';
import { readSpecDir } from '../spec/files.js';
import { classify } from '../spec/load.js';
import { computeImpact } from '../changes/impact.js';

export interface ChangeOptions {
  spec?: string;
}

const specRootOf = (dir: string, opts: ChangeOptions) => join(resolve(dir), opts.spec ?? 'spec');

/** Normalise an object key: IDs upper-case, `term:` / `file:` kept as given. */
export const normalizeKey = (key: string) =>
  /^(term|file):/.test(key) ? key.trim() : key.trim().toUpperCase();

export function runChangeNew(
  dir: string,
  title: string,
  opts: ChangeOptions = {},
): { id: string; file: string } {
  if (!title?.trim()) throw new ChangeError('alterspec change new needs --title');
  const specRoot = specRootOf(dir, opts);
  const nnn = nextNumber(readSpecDir(specRoot), 'CHG-', 3);
  const id = `CHG-${nnn}`;
  const proposal = renderTemplate(readFileSync(join(ASSETS_DIR, 'templates/change-proposal.md'), 'utf8'), {
    NNN: nnn,
    title: title.replace(/\s+/g, ' ').trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"'),
    date: today(),
  });
  mkdirSync(join(specRoot, 'changes', id, 'spec'), { recursive: true });
  writeFileSync(join(specRoot, 'changes', id, 'proposal.md'), proposal);
  return { id, file: `${opts.spec ?? 'spec'}/changes/${id}/proposal.md` };
}

function requireOpen(change: LoadedChange) {
  if (change.proposal.status === 'approved') {
    throw new ChangeError(
      `${change.id} is approved; move it back with \`alterspec change status ${change.id} in_review\` before editing`,
    );
  }
  if (change.proposal.status !== 'draft' && change.proposal.status !== 'in_review') {
    throw new ChangeError(`${change.id} is ${change.proposal.status} and can't be edited`);
  }
}

const writeOverlay = (change: LoadedChange, path: string, content: string) => {
  const full = join(change.overlayRoot, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
};

/** Copy an object into the change overlay and record its base fingerprint. */
export function changeEdit(
  specRoot: string,
  changeId: string,
  rawKey: string,
  opts: { rebase?: boolean } = {},
): { key: string; file: string; copied: boolean } {
  const change = loadChange(specRoot, changeId);
  requireOpen(change);
  const key = normalizeKey(rawKey);
  if (change.proposal.removes.includes(key)) throw new ChangeError(`${key} is removed by ${change.id}`);
  const inOverlay = overlayObjects(change).get(key);
  const current = specObjects(readSpecDir(specRoot)).get(key);

  if (inOverlay) {
    if (opts.rebase && current) {
      updateProposal(change, (doc) => doc.setIn(['base', key], fingerprint(current)));
    }
    return { key, file: `changes/${change.id}/spec/${inOverlay.file}`, copied: false };
  }
  if (!current)
    throw new ChangeError(
      `${key} doesn't exist in the spec; create it with \`alterspec new ... --change ${change.id}\``,
    );

  if (current.kind === 'item') {
    const { type } = classify({ path: current.file, content: '' });
    const existing = change.overlay.find((f) => f.path === current.file)?.content ?? '';
    writeOverlay(
      change,
      current.file,
      existing.trim()
        ? upsertItem(existing, type ?? '', { key, text: current.text })
        : current.text.trimEnd() + '\n',
    );
  } else {
    writeOverlay(change, current.file, current.text);
  }
  updateProposal(change, (doc) => doc.setIn(['base', key], fingerprint(current)));
  // An experience screen and its mockup page are edited together.
  const mockup = `file:experience/mockups/${key.replace(/^UX-/, '')}.html`;
  if (idKind(key) === 'experience' && specObjects(readSpecDir(specRoot)).has(mockup))
    changeEdit(specRoot, changeId, mockup, opts);
  return { key, file: `changes/${change.id}/spec/${current.file}`, copied: true };
}

/** Record a new object created inside a change. */
export function recordNew(specRoot: string, changeId: string, key: string) {
  // A null scalar node prints as `key: null`; a bare null would print as `? key`.
  updateProposal(loadChange(specRoot, changeId), (doc) => doc.setIn(['base', key], doc.createNode(null)));
}

export function runChangeEdit(
  dir: string,
  changeId: string,
  key: string,
  opts: ChangeOptions & { rebase?: boolean } = {},
) {
  return changeEdit(specRootOf(dir, opts), changeId, key, opts);
}

export function runChangeRemove(dir: string, changeId: string, rawKey: string, opts: ChangeOptions = {}) {
  const specRoot = specRootOf(dir, opts);
  const change = loadChange(specRoot, changeId);
  requireOpen(change);
  const key = normalizeKey(rawKey);
  const current = specObjects(readSpecDir(specRoot)).get(key);
  if (!current) {
    if (change.proposal.base[key] === null) {
      throw new ChangeError(`${key} is new in ${change.id}; delete it from the change overlay instead`);
    }
    throw new ChangeError(`${key} doesn't exist in the spec`);
  }
  const inOverlay = overlayObjects(change).get(key);
  if (inOverlay) {
    const full = join(change.overlayRoot, inOverlay.file);
    if (inOverlay.kind === 'item') {
      const { type } = classify({ path: inOverlay.file, content: '' });
      const rest = removeItem(readFileSync(full, 'utf8'), type ?? '', key);
      if (rest.trim()) writeFileSync(full, rest);
      else rmSync(full);
    } else rmSync(full);
  }
  updateProposal(change, (doc) => {
    doc.setIn(['base', key], fingerprint(current));
    if (!change.proposal.removes.includes(key)) doc.addIn(['removes'], key);
  });
  return { key };
}

const TRANSITIONS: Record<string, string[]> = {
  draft: ['in_review', 'rejected'],
  in_review: ['draft', 'approved', 'rejected'],
  approved: ['in_review', 'draft', 'rejected'],
};

export function runChangeStatus(dir: string, changeId: string, status: string, opts: ChangeOptions = {}) {
  const root = resolve(dir);
  const specRoot = specRootOf(dir, opts);
  const change = loadChange(specRoot, changeId);
  const next = ChangeStatus.safeParse(status);
  if (!next.success || next.data === 'applied') {
    throw new ChangeError(
      'status must be draft, in_review, approved or rejected (applied is set by `alterspec apply`)',
    );
  }
  const from = change.proposal.status;
  if (from === next.data) return { id: change.id, status: from };
  if (!TRANSITIONS[from]?.includes(next.data)) {
    throw new ChangeError(`${change.id} can't go from ${from} to ${next.data}`);
  }
  if (next.data === 'in_review' || next.data === 'approved') {
    const impact = computeImpact(root, change.id, opts);
    if (impact.conflicts.length)
      throw new ChangeError(`${change.id} has conflicts: ${impact.conflicts.map((c) => c.key).join(', ')}`);
    if (impact.errors > 0)
      throw new ChangeError(
        `${change.id} leaves ${impact.errors} lint error(s) in the spec; run \`alterspec validate --change ${change.id}\``,
      );
    if (impact.added.length + impact.modified.length + impact.removed.length === 0) {
      throw new ChangeError(`${change.id} doesn't change anything yet`);
    }
  }
  updateProposal(change, (doc) => {
    doc.set('status', next.data);
    if (next.data === 'approved') doc.set('approved_hash', changeHash(change));
    else doc.delete('approved_hash');
  });
  return { id: change.id, status: next.data };
}
