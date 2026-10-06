import { join, resolve } from 'node:path';
import { loadConfig } from '../config.js';
import { lint } from '../lint/lint.js';
import type { Finding } from '../lint/types.js';
import { idKind } from '../schemas/ids.js';
import { acceptanceCriteria } from '../spec/acceptance.js';
import { readSpecDir } from '../spec/files.js';
import { loadSpec } from '../spec/load.js';
import type { Located, LocatedDoc, SpecModel } from '../spec/model.js';
import { outgoingRefs } from '../spec/refs.js';
import { sectionStatus, type SectionedType } from '../spec/sections.js';

export interface RefInfo {
  id: string;
  title?: string;
  file?: string;
  /** Front-matter field holding the reference, e.g. `roles.0.role`. */
  via: string;
}

export interface ShowResult {
  id: string;
  kind: string;
  title?: string;
  file: string;
  line: number;
  data: unknown;
  references: RefInfo[];
  referencedBy: RefInfo[];
  sections?: { heading: string; empty: boolean; missing: boolean }[];
  acceptanceCriteria?: string[];
  openQuestions: { id: string; title: string }[];
  findings: Finding[];
}

function find(model: SpecModel, id: string): Located<unknown> | undefined {
  if (id === 'APP') return model.application;
  for (const m of [
    model.modules,
    model.capabilities,
    model.screens,
    model.entities,
    model.flows,
    model.changes,
    model.rules,
    model.events,
    model.personas,
    model.roles,
    model.decisions,
  ] as Map<string, Located<unknown>>[]) {
    const o = m.get(id);
    if (o) return o;
  }
  return undefined;
}

const titleOf = (o: Located<unknown> | undefined) => (o?.data as { title?: string } | undefined)?.title;

export function runShow(dir: string, rawId: string, opts: { spec?: string } = {}): ShowResult {
  const root = resolve(dir);
  const specDir = opts.spec ?? 'spec';
  const load = loadSpec(readSpecDir(join(root, specDir)));
  const { model } = load;
  const id = rawId.trim().toUpperCase();
  const obj = find(model, id);
  if (!obj) {
    const hint = load.invalidIds.has(id) ? ' (its front-matter is invalid; run `alterspec validate`)' : '';
    throw new Error(`${id} not found${hint}`);
  }

  const all = outgoingRefs(model);
  const info = (ref: string, via: string, holder?: Located<unknown>): RefInfo => {
    const target = holder ?? find(model, ref);
    return {
      id: holder ? holder.id : ref,
      title: titleOf(target),
      file: target ? `${specDir}/${target.file}` : undefined,
      via,
    };
  };
  const references = (all.find((g) => g.owner === obj)?.refs ?? []).map((r) => info(r.id, r.path.join('.')));
  const referencedBy = all.flatMap((g) =>
    g.owner === obj
      ? []
      : g.refs.filter((r) => r.id === id).map((r) => info(r.id, r.path.join('.'), g.owner)),
  );

  const kind = idKind(id) ?? 'unknown';
  const result: ShowResult = {
    id,
    kind,
    title: titleOf(obj),
    file: `${specDir}/${obj.file}`,
    line: obj.line,
    data: obj.data,
    references,
    referencedBy,
    openQuestions: [...model.decisions.values()]
      .filter(
        (d) => d.data.kind === 'open_question' && d.data.status === 'open' && d.data.affects.includes(id),
      )
      .map((d) => ({ id: d.id, title: d.data.title })),
    findings: lint(load, loadConfig(root)).filter(
      (f) => f.id === id || (f.file === obj.file && !f.id && 'body' in obj),
    ),
  };
  if (kind === 'capability' || kind === 'screen' || kind === 'entity') {
    const doc = obj as LocatedDoc<unknown>;
    result.sections = sectionStatus(kind as SectionedType, doc.body).map(({ heading, empty, missing }) => ({
      heading,
      empty,
      missing,
    }));
    if (kind === 'capability') result.acceptanceCriteria = acceptanceCriteria(doc.body).map((a) => a.id);
  }
  return result;
}

export function formatShow(r: ShowResult): string {
  const lines = [`${r.id}${r.title ? ` — ${r.title}` : ''}`, `${r.kind}, ${r.file}:${r.line}`, ''];
  const refs = (label: string, list: RefInfo[]) => {
    lines.push(`${label}:`);
    if (list.length === 0) lines.push('  (none)');
    for (const x of list)
      lines.push(`  ${x.id}${x.title ? ` — ${x.title}` : x.file ? '' : ' (missing)'}  [${x.via}]`);
    lines.push('');
  };
  refs('References', r.references);
  refs('Referenced by', r.referencedBy);
  if (r.sections) {
    const empty = r.sections.filter((s) => s.empty);
    lines.push(`Sections: ${r.sections.length - empty.length}/${r.sections.length} filled`);
    for (const s of empty) lines.push(`  ${s.missing ? 'missing' : 'empty'}: ${s.heading}`);
    lines.push('');
  }
  if (r.acceptanceCriteria)
    lines.push(`Acceptance criteria: ${r.acceptanceCriteria.join(', ') || '(none)'}`, '');
  if (r.openQuestions.length) {
    lines.push('Open questions:', ...r.openQuestions.map((q) => `  ${q.id} — ${q.title}`), '');
  }
  lines.push(r.findings.length ? 'Findings:' : 'Findings: none');
  for (const f of r.findings)
    lines.push(`  ${f.severity}  ${f.rule}  ${f.file}:${f.line ?? ''}  ${f.message}`);
  return lines.join('\n');
}
