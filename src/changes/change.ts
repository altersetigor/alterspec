import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMap, isSeq, parseDocument, type Document } from 'yaml';
import { sha256 } from '../install/hash.js';
import { splitFrontMatter } from '../lib/frontmatter.js';
import { ChangeSchema, type Change } from '../schemas/change.js';
import { readSpecDir, type SpecFile } from '../spec/files.js';

export interface LoadedChange {
  id: string;
  /** Absolute path of changes/CHG-NNN/. */
  dir: string;
  /** Absolute path of the overlay spec root (changes/CHG-NNN/spec/). */
  overlayRoot: string;
  proposalPath: string;
  proposal: Change;
  /** Overlay files, with paths relative to the overlay root (same as in spec/). */
  overlay: SpecFile[];
}

export class ChangeError extends Error {}

export const changeDir = (specRoot: string, id: string) => join(specRoot, 'changes', id);

export function loadChange(specRoot: string, rawId: string): LoadedChange {
  const id = rawId.trim().toUpperCase();
  const dir = changeDir(specRoot, id);
  const proposalPath = join(dir, 'proposal.md');
  if (!existsSync(proposalPath)) {
    const archived = existsSync(join(specRoot, 'changes/archive', id));
    throw new ChangeError(archived ? `${id} is already applied or archived` : `change ${id} doesn't exist`);
  }
  const { raw } = splitFrontMatter(readFileSync(proposalPath, 'utf8'));
  const parsed = ChangeSchema.safeParse(raw === undefined ? undefined : parseDocument(raw).toJS());
  if (!parsed.success) {
    throw new ChangeError(
      `${id}/proposal.md is invalid: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  const overlayRoot = join(dir, 'spec');
  const overlay = existsSync(overlayRoot)
    ? readSpecDir(overlayRoot).filter((f) => f.path.endsWith('.md'))
    : [];
  return { id, dir, overlayRoot, proposalPath, proposal: parsed.data, overlay };
}

/** Edit the proposal's front-matter in place, keeping comments and the body. */
export function updateProposal(change: LoadedChange, edit: (doc: Document) => void): void {
  const src = readFileSync(change.proposalPath, 'utf8');
  const split = splitFrontMatter(src);
  const doc = parseDocument(split.raw ?? '');
  edit(doc);
  for (const key of ['base', 'removes']) {
    const node = doc.get(key, true);
    if ((isMap(node) || isSeq(node)) && node.items.length > 0) node.flow = false;
  }
  writeFileSync(change.proposalPath, `---\n${doc.toString().trimEnd()}\n---\n${split.body}`);
}

/** Fingerprint of everything a reviewer approves: overlay files, removals and the proposal body. */
export function changeHash(change: LoadedChange): string {
  const body = splitFrontMatter(readFileSync(change.proposalPath, 'utf8')).body;
  const overlay = [...change.overlay]
    .sort((a, b) => (a.path < b.path ? -1 : 1))
    .map((f) => [f.path, f.content]);
  return sha256(JSON.stringify({ overlay, removes: [...change.proposal.removes].sort(), body })).slice(0, 16);
}

/** IDs of changes that are not archived. */
export function openChanges(specRoot: string): string[] {
  const dir = join(specRoot, 'changes');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => /^CHG-\d{3}$/.test(n) && existsSync(join(dir, n, 'proposal.md')))
    .sort();
}
