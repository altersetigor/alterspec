import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { loadConfig } from '../config.js';
import { lint } from '../lint/lint.js';
import type { Finding } from '../lint/types.js';
import { blankComments } from '../lib/collection.js';
import { splitFrontMatter } from '../lib/frontmatter.js';
import { readSpecDir, type SpecFile } from '../spec/files.js';
import { loadSpec } from '../spec/load.js';
import type { SpecModel } from '../spec/model.js';
import { outgoingRefs } from '../spec/refs.js';
import { normalizeSection, sections } from '../spec/sections.js';
import { MANIFEST_FILE, PROTOTYPE_DIR, type PrototypeManifest } from '../prototype/index.js';
import { planViews } from '../views/plan.js';
import { loadChange, type LoadedChange } from './change.js';
import { isExperienceAsset, specObjects, type SpecObject } from './fingerprint.js';
import { conflicts, mergeChange, overlayObjects, type Conflict } from './merge.js';

/** Rules only `alterspec apply` can satisfy; they are not reported for a change's merged spec. */
export const SKIP_FOR_CHANGES = new Set([
  'views-stale',
  'generated-edited',
  'generated-missing',
  'direct-edit',
]);

export interface ObjectChange {
  key: string;
  title?: string;
  file: string;
  /** Front-matter fields (or item fields) that differ. */
  fields?: string[];
  /** Body sections that differ (`text` for collection items). */
  sections?: string[];
}

export interface Impact {
  id: string;
  title: string;
  status: string;
  conflicts: Conflict[];
  added: ObjectChange[];
  modified: ObjectChange[];
  removed: ObjectChange[];
  /** Errors in the merged spec (all of them, not only new ones). */
  errors: number;
  /** Findings in the merged spec that the current spec doesn't have. */
  newFindings: Finding[];
  /** Findings of the current spec that the change resolves. */
  resolvedFindings: Finding[];
  /** Objects outside the change that reference something it modifies or removes. */
  affected: { id: string; references: string; via: string }[];
  flows: string[];
  acceptanceCriteria: string[];
  views: { file: string; blocks?: string[] }[];
}

/** Lint a set of files as a change's merged spec would be linted. */
export function lintMerged(root: string, files: SpecFile[]): Finding[] {
  return lint(loadSpec(files), loadConfig(root), root).filter((f) => !SKIP_FOR_CHANGES.has(f.rule));
}

export function mergedFiles(
  specRoot: string,
  changeId: string,
  root?: string,
): { change: LoadedChange; current: SpecFile[]; merged: SpecFile[] } {
  const change = loadChange(specRoot, changeId);
  const current = readSpecDir(specRoot);
  return { change, current, merged: mergeChange(current, change, root) };
}

const yamlOf = (o: SpecObject): Record<string, unknown> => {
  try {
    if (o.kind === 'doc') return (parse(splitFrontMatter(o.text).raw ?? '') as Record<string, unknown>) ?? {};
    const block = /```ya?ml\r?\n([\s\S]*?)```/.exec(blankComments(o.text));
    return (block ? (parse(block[1] ?? '') as Record<string, unknown>) : {}) ?? {};
  } catch {
    return {};
  }
};
const titleOf = (o: SpecObject) => {
  const t = yamlOf(o).title ?? yamlOf(o).term;
  return typeof t === 'string' ? t : undefined;
};

function diff(before: SpecObject, after: SpecObject): Pick<ObjectChange, 'fields' | 'sections'> {
  const a = yamlOf(before);
  const b = yamlOf(after);
  const fields = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
    (k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]),
  );
  let changedSections: string[];
  if (before.kind === 'item') {
    const text = (o: SpecObject) =>
      normalizeSection(
        o.text
          .replace(/```ya?ml[\s\S]*?```/, '')
          .split('\n')
          .slice(1)
          .join('\n'),
      );
    changedSections = text(before) === text(after) ? [] : ['text'];
  } else {
    const sa = sections(splitFrontMatter(before.text).body);
    const sb = sections(splitFrontMatter(after.text).body);
    const headings = [...new Set([...sa, ...sb].map((s) => s.heading))];
    const textOf = (list: typeof sa, h: string) =>
      normalizeSection(
        list
          .find((s) => s.heading === h)
          ?.text.replace(/<!-- GENERATED:start[\s\S]*?GENERATED:end -->/g, '') ?? '',
      );
    changedSections = headings.filter((h) => textOf(sa, h) !== textOf(sb, h));
  }
  return { fields, sections: changedSections };
}

/** Acceptance criteria of a capability body, with their text. */
function acSections(body: string): { id: string; text: string }[] {
  const ac = sections(body).find((s) => /^acceptance criteria$/i.test(s.heading));
  if (!ac) return [];
  return ac.text
    .split(/^### /m)
    .slice(1)
    .map((chunk) => ({ id: chunk.split(/\s/)[0] ?? '', text: chunk }));
}

function viewChanges(before: SpecModel, after: SpecModel): Impact['views'] {
  const pa = planViews(before);
  const pb = planViews(after);
  const out: Impact['views'] = [];
  const files = [...new Set([...pa.blocks.keys(), ...pb.blocks.keys()])].sort();
  for (const file of files) {
    const a = pa.blocks.get(file) ?? {};
    const b = pb.blocks.get(file) ?? {};
    const blocks = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((n) => a[n] !== b[n]);
    if (blocks.length) out.push({ file, blocks });
  }
  const generated = (f: string) => f.startsWith('_generated/') && !f.startsWith(`${PROTOTYPE_DIR}/`);
  for (const file of [...pb.files.keys()].filter(generated).sort()) {
    if (pa.files.get(file) !== pb.files.get(file)) out.push({ file });
  }
  // Prototype pages: only screens whose page content changes, not every page whose navigation does.
  const manifest = (p: typeof pa) =>
    (JSON.parse(p.files.get(`${PROTOTYPE_DIR}/${MANIFEST_FILE}`) ?? '{"screens":{}}') as PrototypeManifest)
      .screens;
  const ma = manifest(pa);
  const mb = manifest(pb);
  for (const id of [...new Set([...Object.keys(ma), ...Object.keys(mb)])].sort()) {
    if (ma[id]?.hash !== mb[id]?.hash) out.push({ file: `${PROTOTYPE_DIR}/${(mb[id] ?? ma[id])!.file}` });
  }
  return out;
}

export function computeImpact(dir: string, changeId: string, opts: { spec?: string } = {}): Impact {
  const root = resolve(dir);
  const specRoot = join(root, opts.spec ?? 'spec');
  const { change, current, merged } = mergedFiles(specRoot, changeId, root);
  const before = specObjects(current);
  const after = specObjects(merged);
  const touched = overlayObjects(change);

  const added: ObjectChange[] = [];
  const modified: ObjectChange[] = [];
  for (const [key] of touched) {
    const a = after.get(key);
    const b = before.get(key);
    if (!a) continue;
    if (!b) added.push({ key, title: titleOf(a), file: a.file });
    else {
      const d = diff(b, a);
      // Mockup files have no front-matter or sections: any edit counts.
      const asset = isExperienceAsset(a.file) && a.text !== b.text;
      if (d.fields?.length || d.sections?.length || asset)
        modified.push({
          key,
          title: titleOf(a),
          file: a.file,
          ...d,
          ...(asset ? { sections: ['content'] } : {}),
        });
    }
  }
  const removed = change.proposal.removes.flatMap((key) => {
    const b = before.get(key);
    return b ? [{ key, title: titleOf(b), file: b.file }] : [];
  });

  const curFindings = lintMerged(root, current);
  const newFindingsAll = lintMerged(root, merged);
  const sig = (f: Finding) => `${f.rule}|${f.file}|${f.message}`;
  const curSigs = new Set(curFindings.map(sig));
  const mergedSigs = new Set(newFindingsAll.map(sig));

  const beforeModel = loadSpec(current).model;
  const afterModel = loadSpec(merged).model;
  const changedKeys = new Set([...modified, ...removed].map((o) => o.key));
  const inChange = new Set([...added, ...modified, ...removed].map((o) => o.key));
  const affected = new Map<string, Impact['affected'][number]>();
  for (const model of [beforeModel, afterModel]) {
    for (const { owner, refs } of outgoingRefs(model)) {
      if (inChange.has(owner.id)) continue;
      for (const r of refs) {
        if (changedKeys.has(r.id))
          affected.set(`${owner.id}|${r.id}`, { id: owner.id, references: r.id, via: r.path.join('.') });
      }
    }
  }

  const caps = new Set(
    [...added, ...modified, ...removed].map((o) => o.key).filter((k) => k.startsWith('CAP-')),
  );
  const flows = new Set<string>(
    [...added, ...modified, ...removed].map((o) => o.key).filter((k) => k.startsWith('FLOW-')),
  );
  for (const model of [beforeModel, afterModel]) {
    for (const f of model.flows.values())
      if (f.data.steps.some((s) => caps.has(s.capability))) flows.add(f.id);
  }
  const acceptance = new Set<string>();
  const ruleOrEntity = [...changedKeys].filter((k) => /^(RULE|ENT|EVT)-/.test(k));
  for (const c of afterModel.capabilities.values()) {
    for (const ac of acSections(c.body)) {
      if (caps.has(c.id) || ruleOrEntity.some((k) => ac.text.includes(k))) acceptance.add(ac.id);
    }
  }

  const byKey = (a: ObjectChange, b: ObjectChange) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  added.sort(byKey);
  modified.sort(byKey);
  return {
    id: change.id,
    title: change.proposal.title,
    status: change.proposal.status,
    conflicts: conflicts(current, change),
    added,
    modified,
    removed,
    errors: newFindingsAll.filter((f) => f.severity === 'error').length,
    newFindings: newFindingsAll.filter((f) => !curSigs.has(sig(f))),
    resolvedFindings: curFindings.filter((f) => !mergedSigs.has(sig(f))),
    affected: [...affected.values()].sort(
      (a, b) => a.id.localeCompare(b.id) || a.references.localeCompare(b.references),
    ),
    flows: [...flows].sort(),
    acceptanceCriteria: [...acceptance].sort(),
    views: viewChanges(beforeModel, afterModel),
  };
}

export function formatImpact(i: Impact): string {
  const list = (items: string[]) => (items.length ? items.map((x) => `- ${x}`).join('\n') : '_None._');
  const obj = (o: ObjectChange) =>
    `${o.key}${o.title ? ` — ${o.title}` : ''}${o.fields?.length ? ` (fields: ${o.fields.join(', ')})` : ''}${o.sections?.length ? ` (sections: ${o.sections.join(', ')})` : ''}`;
  const finding = (f: Finding) =>
    `${f.severity} ${f.rule} — ${f.file}${f.line ? `:${f.line}` : ''} — ${f.message}`;
  return [
    `# Impact of ${i.id} — ${i.title}`,
    '',
    `Status: ${i.status}. ${i.errors} error(s) in the spec after this change. ${i.conflicts.length} conflict(s).`,
    '',
    '## Conflicts',
    '',
    list(i.conflicts.map((c) => c.message)),
    '',
    '## Added',
    '',
    list(i.added.map(obj)),
    '',
    '## Modified',
    '',
    list(i.modified.map(obj)),
    '',
    '## Removed',
    '',
    list(i.removed.map(obj)),
    '',
    '## Affected objects',
    '',
    list(i.affected.map((a) => `${a.id} references ${a.references} (${a.via})`)),
    '',
    '## Affected flows',
    '',
    list(i.flows),
    '',
    '## Affected acceptance criteria',
    '',
    list(i.acceptanceCriteria),
    '',
    '## Generated views that change',
    '',
    list(i.views.map((v) => `${v.file}${v.blocks ? `: ${v.blocks.join(', ')}` : ''}`)),
    '',
    '## New findings',
    '',
    list(i.newFindings.map(finding)),
    '',
    '## Findings this change resolves',
    '',
    list(i.resolvedFindings.map(finding)),
    '',
  ].join('\n');
}
