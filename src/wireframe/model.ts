import { idKind } from '../schemas/ids.js';
import type { Entity } from '../schemas/entity.js';
import type { FieldMode } from '../schemas/screen.js';
import type { LocatedDoc, SpecModel } from '../spec/model.js';
import { normalizeSection, sections } from '../spec/sections.js';
import { mockRecords, type MockRecord } from './mock.js';
import type { z } from 'zod';

/**
 * The page model the generic wireframe and every design-system variant render from. Pure and sorted, so the same
 * spec always gives the same pages. `src` values are the `data-src` markers that tie each element to the spec.
 */
export interface WireframeModel {
  title: string;
  roles: { id: string; title: string }[];
  modules: { id: string; title: string; screens: { id: string; title: string }[] }[];
  screens: ScreenPage[];
}

export interface ScreenPage {
  id: string;
  src: string;
  title: string;
  module: { id: string; title: string };
  status: string;
  purpose?: string;
  roles: { id: string; title: string; scope?: string; src: string }[];
  entryPoints: { src: string; screen?: string; text: string }[];
  groups: FieldGroup[];
  actions: ActionItem[];
  states: StateItem[];
  gaps: Gap[];
}

export interface FieldGroup {
  src: string;
  entity: string;
  entityTitle: string;
  mode: z.infer<typeof FieldMode>;
  /** Roles that see this group. */
  roles: string[];
  fields: Field[];
  /** Whether rows show the entity's lifecycle state. */
  hasState: boolean;
  records: MockRecord[];
}

export interface Field {
  src: string;
  name: string;
  kind: string;
  required: boolean;
  options?: string[];
}

export interface ActionItem {
  src: string;
  id: string;
  label: string;
  capability: string;
  capabilityTitle?: string;
  summary?: string;
  /** Roles that see this action. */
  roles: string[];
}

export interface StateItem {
  src: string;
  key: 'empty' | 'no-permission' | 'validation';
  label: string;
  text?: string;
}

export interface Gap {
  src: string;
  text: string;
}

const STATE_LABELS: [StateItem['key'], string][] = [
  ['empty', 'Empty'],
  ['no-permission', 'No permission'],
  ['validation', 'Validation errors'],
];

const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Plain text of a markdown fragment: links, emphasis and code marks removed. */
export function plain(md: string): string {
  return normalizeSection(md)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();
}

function section(body: string, heading: string): string | undefined {
  const s = sections(body).find((x) => x.heading.toLowerCase() === heading.toLowerCase());
  const text = s ? plain(s.text) : '';
  return text || undefined;
}

/** `- **Empty:** text` style lines of the Business states section. */
function businessStates(body: string): Map<string, string> {
  const s = sections(body).find((x) => x.heading.toLowerCase() === 'business states');
  const out = new Map<string, string>();
  for (const line of (s?.text ?? '').split('\n')) {
    const m = /^\s*[-*]\s*\*\*([^*:]+):?\*\*:?\s*(.*)$/.exec(line);
    const text = m ? plain(m[2]!) : '';
    if (m && text) out.set(m[1]!.trim().toLowerCase(), text);
  }
  return out;
}

export function buildWireframe(model: SpecModel): WireframeModel {
  const roleTitle = (id: string) => model.roles.get(id)?.data.title ?? id;
  const moduleTitle = (id: string) => model.modules.get(id)?.data.title ?? id;
  const screens = [...model.screens.values()].sort(byId);
  const records = new Map<string, MockRecord[]>();
  const recordsOf = (id: string): MockRecord[] => {
    let r = records.get(id);
    if (!r) {
      const e = model.entities.get(id);
      r = e ? mockRecords(e.data, (target) => displayValues(model, target)) : [];
      records.set(id, r);
    }
    return r;
  };

  const moduleIds = [...new Set(screens.map((s) => s.data.module))].sort();
  return {
    title: model.application?.data.title ?? 'Wireframe',
    roles: [...new Set(screens.flatMap((s) => s.data.roles.map((r) => r.role)))]
      .sort()
      .map((id) => ({ id, title: roleTitle(id) })),
    modules: moduleIds.map((id) => ({
      id,
      title: moduleTitle(id),
      screens: screens.filter((s) => s.data.module === id).map((s) => ({ id: s.id, title: s.data.title })),
    })),
    screens: screens.map((s) => screenPage(model, s, roleTitle, moduleTitle, recordsOf)),
  };
}

function screenPage(
  model: SpecModel,
  s: LocatedDoc<import('../schemas/screen.js').Screen>,
  roleTitle: (id: string) => string,
  moduleTitle: (id: string) => string,
  recordsOf: (id: string) => MockRecord[],
): ScreenPage {
  const d = s.data;
  const gaps: Gap[] = [];
  const gap = (key: string, text: string) => gaps.push({ src: `${s.id}.gap.${key}`, text });
  const screenRoles = d.roles.map((r) => r.role);

  const purpose = section(s.body, 'Purpose');
  if (!purpose) gap('purpose', 'Not specified: purpose of the screen');
  if (d.roles.length === 0) gap('roles', 'Not specified: who uses this screen');

  const groups: FieldGroup[] = d.fields.map((f) => {
    const entity = model.entities.get(f.entity);
    const attrs = new Map((entity?.data.attributes ?? []).map((a) => [a.name, a]));
    const src = `${s.id}.${f.entity}`;
    if (!entity) gap(`${f.entity}`, `Not specified: entity ${f.entity} does not exist`);
    const fields = f.attributes.map((name) => {
      const a = attrs.get(name);
      if (entity && !a) gap(`${f.entity}.${name}`, `Not specified: ${f.entity} has no attribute "${name}"`);
      return {
        src: `${src}.${name}`,
        name,
        kind: a?.kind ?? 'other',
        required: a?.required ?? false,
        ...(a?.kind === 'choice' ? { options: choiceOptions(entity!.data, name) } : {}),
      };
    });
    return {
      src,
      entity: f.entity,
      entityTitle: entity?.data.title ?? f.entity,
      mode: f.mode,
      roles: f.roles.length ? [...f.roles].sort() : [...screenRoles].sort(),
      fields,
      hasState: (entity?.data.states.length ?? 0) > 0,
      // Only the values this group shows, so a page changes only when what it shows changes.
      records: recordsOf(f.entity).map((r) => ({
        ...r,
        values: Object.fromEntries(f.attributes.map((n) => [n, r.values[n] ?? ''])),
      })),
    };
  });
  if (d.fields.length === 0) gap('fields', 'Not specified: the data this screen shows');

  const actions: ActionItem[] = d.actions.map((a) => {
    const cap = model.capabilities.get(a.capability);
    if (!cap) gap(a.id, `Not specified: ${a.id} performs ${a.capability}, which does not exist`);
    const capRoles = cap?.data.roles.map((r) => r.role) ?? [];
    const onScreen = capRoles.filter((r) => screenRoles.includes(r));
    const summary = cap ? section(cap.body, 'Summary and user story') : undefined;
    return {
      src: `${s.id}.${a.id}`,
      id: a.id,
      label: a.label,
      capability: a.capability,
      ...(cap ? { capabilityTitle: cap.data.title } : {}),
      ...(summary ? { summary } : {}),
      roles: (a.roles.length ? [...a.roles] : onScreen.length ? onScreen : capRoles).sort(),
    };
  });

  const found = businessStates(s.body);
  const states: StateItem[] = STATE_LABELS.map(([key, label]) => {
    const text = found.get(label.toLowerCase());
    if (!text) gap(`state.${key}`, `Not specified: what people see when the state is "${label}"`);
    return { src: `${s.id}.state.${key}`, key, label, ...(text ? { text } : {}) };
  });

  return {
    id: s.id,
    src: s.id,
    title: d.title,
    module: { id: d.module, title: moduleTitle(d.module) },
    status: d.status,
    ...(purpose ? { purpose } : {}),
    roles: d.roles.map((r) => ({
      id: r.role,
      title: roleTitle(r.role),
      src: `${s.id}.role.${r.role}`,
      ...(r.scope ? { scope: r.scope } : {}),
    })),
    entryPoints: d.entry_points.map((e, i) => {
      const target = idKind(e) === 'screen' && model.screens.has(e) ? e : undefined;
      return {
        src: `${s.id}.entry.${i + 1}`,
        text: target ? `${e} ${model.screens.get(e)!.data.title}` : e,
        ...(target ? { screen: target } : {}),
      };
    }),
    groups,
    actions,
    states,
    gaps,
  };
}

function choiceOptions(entity: Entity, name: string): string[] {
  return entity.attributes.find((a) => a.name === name)?.options ?? [];
}

/** How records of an entity are named when another entity refers to them. */
function displayValues(model: SpecModel, entityId: string): string[] {
  const e = model.entities.get(entityId);
  if (!e) return [];
  return mockRecords(e.data, () => []).map((r) => r.label);
}
