import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { runViews } from '../commands/views.js';
import { splitFrontMatter } from '../lib/frontmatter.js';
import { encodingOf, readSpecDir } from '../spec/files.js';
import { readBaseline, today, writeBaseline } from './baseline.js';
import { ChangeError, changeHash, updateProposal } from './change.js';
import { fingerprint, specObjects } from './fingerprint.js';
import { computeImpact, handoffImpact, mergedFiles } from './impact.js';
import { runHandoff } from '../commands/handoff.js';
import { loadConfig } from '../config.js';
import { lint } from '../lint/lint.js';
import { loadSpec } from '../spec/load.js';
import { overlayObjects } from './merge.js';

export interface ApplyResult {
  id: string;
  written: string[];
  deleted: string[];
  versions: { key: string; version: number }[];
  archivedTo: string;
  /** Bundles exported for developers after the merge, and candidates that don't pass the handoff gate yet. */
  handoff: { exported: { id: string; folder: string }[]; blocked: { id: string; reason: string }[] };
}

/** Raise `version` in a document's front-matter. */
function bumpVersion(content: string): { content: string; version: number } | undefined {
  const split = splitFrontMatter(content);
  if (split.raw === undefined) return undefined;
  const doc = parseDocument(split.raw);
  const v = doc.get('version');
  if (typeof v !== 'number') return undefined;
  doc.set('version', v + 1);
  return { content: `---\n${doc.toString().trimEnd()}\n---\n${split.body}`, version: v + 1 };
}

const versionOf = (content: string) => {
  const raw = splitFrontMatter(content).raw;
  const v =
    raw === undefined ? undefined : (parseDocument(raw).toJS() as { version?: unknown } | null)?.version;
  return typeof v === 'number' ? v : undefined;
};

export function runApply(
  dir: string,
  changeId: string,
  opts: { spec?: string; date?: string } = {},
): ApplyResult {
  const root = resolve(dir);
  const specDir = opts.spec ?? 'spec';
  const specRoot = join(root, specDir);
  const { change, current, merged } = mergedFiles(specRoot, changeId, root);

  if (change.proposal.status !== 'approved') {
    throw new ChangeError(
      `${change.id} is ${change.proposal.status}; only an approved change can be applied`,
    );
  }
  if (change.proposal.approved_hash !== changeHash(change)) {
    throw new ChangeError(`${change.id} was edited after it was approved; review it again and re-approve it`);
  }
  const impact = computeImpact(root, change.id, opts);
  if (impact.conflicts.length)
    throw new ChangeError(`${change.id} has conflicts: ${impact.conflicts.map((c) => c.message).join('; ')}`);
  if (impact.errors)
    throw new ChangeError(
      `${change.id} would leave ${impact.errors} lint error(s); run \`alterspec validate --change ${change.id}\``,
    );

  const files = new Map(merged.map((f) => [f.path, f.content]));
  const before = new Map(current.map((f) => [f.path, f.content]));
  const versions: ApplyResult['versions'] = [];
  for (const m of impact.modified) {
    const content = files.get(m.file);
    if (content === undefined) continue;
    const old = before.get(m.file);
    const was = old === undefined ? undefined : versionOf(old);
    if (was === undefined || versionOf(content) !== was) continue;
    const bumped = bumpVersion(content);
    if (bumped) {
      files.set(m.file, bumped.content);
      versions.push({ key: m.key, version: bumped.version });
    }
  }

  const managed = (p: string) => !p.startsWith('changes/') && !p.startsWith('_generated/');
  const written: string[] = [];
  const deleted: string[] = [];
  for (const [path, content] of files) {
    if (!managed(path) || before.get(path) === content) continue;
    const full = join(specRoot, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, encodingOf(path));
    written.push(path);
  }
  for (const path of before.keys()) {
    if (managed(path) && !files.has(path)) {
      rmSync(join(specRoot, path));
      deleted.push(path);
    }
  }

  const baseline = readBaseline(specRoot);
  if (baseline) {
    const now = specObjects(readSpecDir(specRoot));
    // Every object the overlay holds, not only those the impact lists as modified: an edit the impact doesn't
    // count (whitespace, a comment) still changes the fingerprint, and must not read as a direct edit afterwards.
    const touched = new Set([
      ...overlayObjects(change).keys(),
      ...[...impact.added, ...impact.modified].map((o) => o.key),
    ]);
    for (const key of touched) {
      const o = now.get(key);
      if (o) baseline.objects[key] = { hash: fingerprint(o), file: o.file };
    }
    for (const o of impact.removed) delete baseline.objects[o.key];
    baseline.updated = today();
    baseline.objects = Object.fromEntries(
      Object.entries(baseline.objects).sort(([a], [b]) => (a < b ? -1 : 1)),
    );
    writeBaseline(specRoot, baseline);
  }

  updateProposal(change, (doc) => {
    doc.set('status', 'applied');
    doc.set('applied', today());
  });
  const archivedTo = join(specRoot, 'changes/archive', change.id);
  mkdirSync(dirname(archivedTo), { recursive: true });
  renameSync(change.dir, archivedTo);
  // after archiving, so the generated index no longer lists the change as open
  runViews(root, { spec: specDir });

  // Developers get every capability of the change that passes the handoff gate, and every bundle that went stale.
  const handoff: ApplyResult['handoff'] = { exported: [], blocked: [] };
  const nowFiles = readSpecDir(specRoot);
  const nowLoad = loadSpec(nowFiles);
  const plan = handoffImpact(
    root,
    nowLoad.model,
    nowFiles,
    lint(nowLoad, loadConfig(root), root),
    [...impact.added, ...impact.modified].map((o) => o.key),
  );
  handoff.blocked = plan.blocked;
  for (const id of plan.exports) {
    const r = runHandoff(root, id, { spec: specDir, ...(opts.date ? { date: opts.date } : {}) });
    handoff.exported.push({ id, folder: r.outputs[0]!.folder });
  }

  return {
    id: change.id,
    written: written.sort(),
    deleted: deleted.sort(),
    versions,
    archivedTo: `${specDir}/changes/archive/${change.id}`,
    handoff,
  };
}
