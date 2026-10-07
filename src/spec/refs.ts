import { idKind } from '../schemas/ids.js';
import type { Located, SpecModel } from './model.js';

export interface Ref {
  id: string;
  path: (string | number)[];
}

/** Every ID reference held in front-matter or collection items, grouped by the object holding it. */
export function outgoingRefs(model: SpecModel): { owner: Located<unknown>; refs: Ref[] }[] {
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
        ...each(s.data.fields, ['fields'], (f) => f.entity),
        ...s.data.fields.flatMap((f, i) => each(f.roles, ['fields', i, 'roles'])),
        ...each(s.data.actions, ['actions'], (a) => a.capability),
        ...s.data.actions.flatMap((a, i) => each(a.roles, ['actions', i, 'roles'])),
        ...each(s.data.entry_points, ['entry_points'], (e) => (idKind(e) ? e : undefined)),
      ],
    });
  }
  for (const e of model.entities.values()) {
    out.push({
      owner: e,
      refs: [
        ...each(e.data.attributes, ['attributes'], (a) => a.references).map((r) => ({
          ...r,
          path: [...r.path, 'references'],
        })),
        ...each(e.data.relationships, ['relationships'], (r) => r.entity),
      ],
    });
  }
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
