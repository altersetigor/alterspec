import { posix } from 'node:path';
import { codeInId, idKind, moduleCode } from '../../schemas/ids.js';
import { exists, type Located, type SpecModel } from '../../spec/model.js';
import type { LintRule, RawFinding } from '../types.js';

const stem = (file: string) => posix.basename(file, '.md');

export const duplicateId: LintRule = {
  name: 'duplicate-id',
  severity: 'error',
  description: 'An ID is defined more than once.',
  check: ({ model }) =>
    [...model.definitions].flatMap(([id, defs]) =>
      defs.slice(1).map((d) => ({
        file: d.file,
        line: d.line,
        id,
        message: `${id} is already defined in ${defs[0]?.file}:${defs[0]?.line}`,
      })),
    ),
};

export const idLocation: LintRule = {
  name: 'id-location',
  severity: 'error',
  description: 'File names, module folders and collection headings agree with the IDs they hold.',
  check: ({ model }) => {
    const out: RawFinding[] = [];
    const parts = new Map(model.files.map((f) => [f.path, f.parts]));
    const bad = (o: Located<unknown>, message: string) =>
      out.push({ file: o.file, line: o.line, id: o.id, message });

    const named = [
      ...model.capabilities.values(),
      ...model.screens.values(),
      ...model.entities.values(),
      ...model.flows.values(),
    ];
    for (const o of named) {
      if (stem(o.file) !== o.id) bad(o, `file name should be ${o.id}.md`);
    }
    for (const o of [...model.capabilities.values(), ...model.screens.values()]) {
      const folder = parts.get(o.file)?.mod;
      const code = codeInId(o.id);
      if (code && folder !== code.toLowerCase()) bad(o, `${o.id} belongs in modules/${code.toLowerCase()}/`);
    }
    for (const m of model.modules.values()) {
      const code = moduleCode(m.id).toLowerCase();
      if (parts.get(m.file)?.mod !== code) bad(m, `module ${m.id} belongs in modules/${code}/module.md`);
    }
    for (const c of model.changes.values()) {
      if (parts.get(c.file)?.change !== c.id) bad(c, `change ${c.id} belongs in changes/${c.id}/proposal.md`);
    }
    const items = [
      ...model.rules.values(),
      ...model.events.values(),
      ...model.personas.values(),
      ...model.roles.values(),
      ...model.decisions.values(),
    ];
    for (const item of items) {
      if (item.heading !== item.id && !item.heading?.startsWith(`${item.id} `)) {
        bad(item, `heading should start with ${item.id}`);
      }
    }
    for (const r of model.rules.values()) {
      const code = codeInId(r.id);
      if (code) {
        const expected = `modules/${code.toLowerCase()}/rules.md`;
        if (r.file !== expected) bad(r, `module rule ${r.id} belongs in ${expected}`);
      } else if (r.file !== 'application/rules.md') {
        bad(r, `application rule ${r.id} belongs in application/rules.md; module rules are RULE-<MOD>-NNN`);
      }
    }
    return out;
  },
};

export const moduleRegistry: LintRule = {
  name: 'module-registry',
  severity: 'error',
  description: 'Module folders, module files and the application module list agree.',
  check: ({ model }) => {
    const out: RawFinding[] = [];
    const app = model.application;
    if (!app) {
      if (!model.raw.some((f) => f.path === 'application/application.md')) {
        out.push({ file: 'application/application.md', message: 'application.md is missing' });
      }
      return out;
    }
    const listed = new Set(app.data.modules);
    app.data.modules.forEach((id, i) => {
      if (!model.modules.has(id)) {
        out.push({
          file: app.file,
          line: app.lineOf(['modules', i]),
          id,
          message: `${id} is listed but modules/${moduleCode(id).toLowerCase()}/module.md doesn't exist`,
        });
      }
    });
    for (const m of model.modules.values()) {
      if (!listed.has(m.id))
        out.push({
          file: m.file,
          line: 1,
          id: m.id,
          message: `${m.id} is not listed in application.md modules`,
        });
    }
    const withFile = new Set([...model.files].filter((f) => f.type === 'module').map((f) => f.parts.mod));
    for (const dir of model.moduleDirs) {
      if (!withFile.has(dir))
        out.push({ file: `modules/${dir}/module.md`, message: `folder modules/${dir}/ has no module.md` });
    }
    return out;
  },
};

interface Ref {
  id: string;
  path: (string | number)[];
}

function refsOf(model: SpecModel): { owner: Located<unknown>; refs: Ref[] }[] {
  const out: { owner: Located<unknown>; refs: Ref[] }[] = [];
  const each = <T>(
    list: readonly T[],
    path: (string | number)[],
    pick: (x: T) => string | undefined = (x) => x as string,
  ) =>
    list.flatMap((x, i) => {
      const id = pick(x);
      return id ? [{ id, path: [...path, i] }] : [];
    });

  for (const c of model.capabilities.values()) {
    const d = c.data;
    out.push({
      owner: c,
      refs: [
        { id: d.module, path: ['module'] },
        ...each(d.roles, ['roles'], (r) => r.role),
        ...each(d.screens, ['screens']),
        ...each(d.entities, ['entities'], (e) => e.entity),
        ...each(d.rules, ['rules']),
        ...each(d.events.emits, ['events', 'emits']),
        ...each(d.events.consumes, ['events', 'consumes']),
        ...each(d.depends_on, ['depends_on']),
        ...each(d.flows, ['flows']),
      ],
    });
  }
  for (const s of model.screens.values()) {
    out.push({
      owner: s,
      refs: [
        { id: s.data.module, path: ['module'] },
        ...each(s.data.roles, ['roles'], (r) => r.role),
        ...each(s.data.actions, ['actions'], (a) => a.capability),
        ...each(s.data.entry_points, ['entry_points'], (e) => (idKind(e) ? e : undefined)),
      ],
    });
  }
  for (const e of model.entities.values())
    out.push({ owner: e, refs: each(e.data.relationships, ['relationships'], (r) => r.entity) });
  for (const f of model.flows.values()) {
    out.push({
      owner: f,
      refs: [
        ...each(f.data.roles, ['roles']),
        ...f.data.steps.flatMap((s, i) => [
          { id: s.capability, path: ['steps', i, 'capability'] },
          ...(s.role ? [{ id: s.role, path: ['steps', i, 'role'] }] : []),
        ]),
      ],
    });
  }
  for (const m of model.modules.values())
    out.push({ owner: m, refs: each(m.data.depends_on, ['depends_on']) });
  for (const p of model.personas.values()) out.push({ owner: p, refs: each(p.data.roles, ['roles']) });
  for (const r of model.rules.values()) out.push({ owner: r, refs: each(r.data.entities, ['entities']) });
  for (const e of model.events.values()) out.push({ owner: e, refs: each(e.data.entities, ['entities']) });
  for (const d of model.decisions.values()) {
    out.push({
      owner: d,
      refs: [
        ...each(d.data.affects, ['affects']),
        ...(d.data.supersedes ? [{ id: d.data.supersedes, path: ['supersedes'] }] : []),
      ],
    });
  }
  return out;
}

export const unknownReference: LintRule = {
  name: 'unknown-reference',
  severity: 'error',
  description: 'Every referenced ID exists.',
  check: ({ model, invalidIds }) =>
    refsOf(model).flatMap(({ owner, refs }) =>
      refs
        .filter((r) => !exists(model, r.id) && !invalidIds.has(r.id))
        .map((r) => ({
          file: owner.file,
          line: owner.lineOf(r.path),
          id: owner.id,
          message: `${owner.id} references ${r.id}, which doesn't exist`,
        })),
    ),
};

const PLACEHOLDER = /\{\{\s*[a-zA-Z0-9_]+\s*\}\}/;

export const placeholder: LintRule = {
  name: 'placeholder',
  severity: 'error',
  description: 'No template placeholders ({{...}}) are left in the spec.',
  check: ({ model }) =>
    model.files.flatMap((f) =>
      f.content.split('\n').flatMap((l, i) => {
        const m = PLACEHOLDER.exec(l);
        return m
          ? [{ file: f.path, line: i + 1, message: `template placeholder ${m[0]} was not filled in` }]
          : [];
      }),
    ),
};
