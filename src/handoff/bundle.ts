import { fingerprint, specObjects } from '../changes/fingerprint.js';
import { termMatcher } from '../lint/text.js';
import type { Capability, Entity, Screen } from '../schemas/index.js';
import type { SpecFile } from '../spec/files.js';
import type { LocatedDoc, SpecModel } from '../spec/model.js';
import { sections } from '../spec/sections.js';
import { cleanText, extractCapability, firstParagraph, itemProse, type CapabilityText } from './extract.js';

export interface BundleCapability {
  id: string;
  title: string;
  status: string;
  version: number;
  module: string;
  roles: { role: string; title: string; scope: string }[];
  screens: string[];
  entities: Capability['entities'];
  rules: string[];
  events: Capability['events'];
  dependsOn: string[];
  flows: string[];
  text: CapabilityText;
}

export interface Bundle {
  scope: { id: string; kind: 'capability' | 'module'; title: string };
  application: { title: string };
  module: { id: string; title: string; description: string };
  capabilities: BundleCapability[];
  roles: { id: string; title: string; description: string; personas: string[] }[];
  personas: { id: string; title: string; description: string; roles: string[] }[];
  entities: {
    id: string;
    title: string;
    description: string;
    attributes: Entity['attributes'];
    states: string[];
    initialState?: string;
    transitions: Entity['transitions'];
    relationships: Entity['relationships'];
  }[];
  rules: { id: string; title: string; statement: string }[];
  events: { id: string; title: string; external: boolean; description: string }[];
  screens: { id: string; title: string; purpose: string; actions: Screen['actions'] }[];
  flows: {
    id: string;
    title: string;
    steps: { step: number; capability: string; title: string; role?: string; inScope: boolean }[];
  }[];
  glossary: { term: string; definition: string; forbidden: string[] }[];
  openQuestions: { id: string; title: string; context: string }[];
  /** Source objects and their fingerprints, for staleness checks. */
  sources: { id: string; status?: string; version?: number; fingerprint: string }[];
}

const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const sectionText = (body: string, heading: string) =>
  cleanText(sections(body).find((s) => s.heading.toLowerCase() === heading.toLowerCase())?.text ?? '');

/** Capabilities of a module in dependency order (dependencies first), ties by ID. */
function orderByDependencies(caps: LocatedDoc<Capability>[]): LocatedDoc<Capability>[] {
  const ids = new Set(caps.map((c) => c.id));
  const done = new Set<string>();
  const out: LocatedDoc<Capability>[] = [];
  const visit = (c: LocatedDoc<Capability>, path: Set<string>) => {
    if (done.has(c.id) || path.has(c.id)) return;
    path.add(c.id);
    for (const dep of [...c.data.depends_on].sort()) {
      const d = caps.find((x) => x.id === dep);
      if (d && ids.has(dep)) visit(d, path);
    }
    done.add(c.id);
    out.push(c);
  };
  for (const c of [...caps].sort(byId)) visit(c, new Set());
  return out;
}

export function buildBundle(model: SpecModel, files: SpecFile[], rawId: string): Bundle {
  const id = rawId.trim().toUpperCase();
  const objects = specObjects(files);
  let caps: LocatedDoc<Capability>[];
  let moduleId: string;
  let kind: Bundle['scope']['kind'];
  if (model.capabilities.has(id)) {
    const c = model.capabilities.get(id)!;
    caps = [c];
    moduleId = c.data.module;
    kind = 'capability';
  } else if (model.modules.has(id)) {
    moduleId = id;
    caps = orderByDependencies([...model.capabilities.values()].filter((c) => c.data.module === id));
    kind = 'module';
  } else {
    throw new Error(`${id} is not a capability or module`);
  }
  const mod = model.modules.get(moduleId);
  if (!mod) throw new Error(`module ${moduleId} doesn't exist`);
  const capIds = new Set(caps.map((c) => c.id));

  const roleIds = new Set(caps.flatMap((c) => c.data.roles.map((r) => r.role)));
  const entityIds = new Set(caps.flatMap((c) => c.data.entities.map((e) => e.entity)));
  const ruleIds = new Set(caps.flatMap((c) => c.data.rules));
  const eventIds = new Set(caps.flatMap((c) => [...c.data.events.emits, ...c.data.events.consumes]));
  const screenIds = new Set(caps.flatMap((c) => c.data.screens));
  const flowIds = new Set(caps.flatMap((c) => c.data.flows));
  for (const f of model.flows.values())
    if (f.data.steps.some((s) => capIds.has(s.capability))) flowIds.add(f.id);

  const prose = (key: string) => itemProse(objects.get(key)?.text ?? '');
  const capabilities: BundleCapability[] = caps.map((c) => ({
    id: c.id,
    title: c.data.title,
    status: c.data.status,
    version: c.data.version,
    module: c.data.module,
    roles: c.data.roles.map((r) => ({
      role: r.role,
      title: model.roles.get(r.role)?.data.title ?? r.role,
      scope: r.scope,
    })),
    screens: c.data.screens,
    entities: c.data.entities,
    rules: c.data.rules,
    events: c.data.events,
    dependsOn: c.data.depends_on,
    flows: c.data.flows,
    text: extractCapability(c.body),
  }));

  const personas = [...model.personas.values()]
    .filter((p) => p.data.roles.some((r) => roleIds.has(r)))
    .sort(byId)
    .map((p) => ({ id: p.id, title: p.data.title, description: prose(p.id), roles: p.data.roles }));

  const scopeText = [
    ...caps.map((c) => `${c.data.title}\n${c.body}`),
    ...[...entityIds].map((e) => model.entities.get(e)?.data.title ?? ''),
  ].join('\n');
  const glossary = model.glossary
    .filter((g) => termMatcher(g.data.term).test(scopeText))
    .map((g) => ({
      term: g.data.term,
      definition: prose(`term:${g.data.term}`),
      forbidden: g.data.forbidden,
    }))
    .sort((a, b) => a.term.localeCompare(b.term));

  const scoped = new Set([...capIds, ...entityIds, ...ruleIds, ...eventIds, ...screenIds, moduleId]);
  const openQuestions = [...model.decisions.values()]
    .filter(
      (d) =>
        d.data.kind === 'open_question' &&
        d.data.status === 'open' &&
        d.data.affects.some((a) => scoped.has(a)),
    )
    .sort(byId)
    .map((d) => ({ id: d.id, title: d.data.title, context: prose(d.id) }));

  const pick = <T>(ids: Set<string>, get: (id: string) => T | undefined) =>
    [...ids].sort().flatMap((x) => {
      const v = get(x);
      return v ? [v] : [];
    });

  const sourceIds = [
    moduleId,
    ...capIds,
    ...roleIds,
    ...entityIds,
    ...ruleIds,
    ...eventIds,
    ...screenIds,
    ...flowIds,
    ...personas.map((p) => p.id),
    ...glossary.map((g) => `term:${g.term}`),
    ...openQuestions.map((q) => q.id),
  ];
  const sources = [...new Set(sourceIds)].sort().flatMap((key) => {
    const o = objects.get(key);
    if (!o) return [];
    const doc =
      model.capabilities.get(key) ??
      model.screens.get(key) ??
      model.entities.get(key) ??
      model.flows.get(key) ??
      model.modules.get(key);
    const data = doc?.data as { status?: string; version?: number } | undefined;
    return [{ id: key, status: data?.status, version: data?.version, fingerprint: fingerprint(o) }];
  });

  return {
    scope: { id, kind, title: kind === 'module' ? mod.data.title : caps[0]!.data.title },
    application: { title: model.application?.data.title ?? '' },
    module: {
      id: mod.id,
      title: mod.data.title,
      description: firstParagraph(sectionText(mod.body, 'Description')),
    },
    capabilities,
    roles: pick(roleIds, (r) => {
      const role = model.roles.get(r);
      return (
        role && {
          id: r,
          title: role.data.title,
          description: prose(r),
          personas: personas.filter((p) => p.roles.includes(r)).map((p) => p.id),
        }
      );
    }),
    personas,
    entities: pick(entityIds, (e) => {
      const ent = model.entities.get(e);
      return (
        ent && {
          id: e,
          title: ent.data.title,
          description: firstParagraph(sectionText(ent.body, 'Description')),
          attributes: ent.data.attributes,
          states: ent.data.states,
          initialState: ent.data.initial_state,
          transitions: ent.data.transitions,
          relationships: ent.data.relationships,
        }
      );
    }),
    rules: pick(ruleIds, (r) => {
      const rule = model.rules.get(r);
      return rule && { id: r, title: rule.data.title, statement: firstParagraph(prose(r)) };
    }),
    events: pick(eventIds, (e) => {
      const ev = model.events.get(e);
      return (
        ev && {
          id: e,
          title: ev.data.title,
          external: ev.data.external,
          description: firstParagraph(prose(e)),
        }
      );
    }),
    screens: pick(screenIds, (s) => {
      const scr = model.screens.get(s);
      return (
        scr && {
          id: s,
          title: scr.data.title,
          purpose: firstParagraph(sectionText(scr.body, 'Purpose')),
          actions: scr.data.actions,
        }
      );
    }),
    flows: pick(flowIds, (f) => {
      const flow = model.flows.get(f);
      return (
        flow && {
          id: f,
          title: flow.data.title,
          steps: flow.data.steps.map((s) => ({
            step: s.step,
            capability: s.capability,
            title: model.capabilities.get(s.capability)?.data.title ?? s.capability,
            role: s.role,
            inScope: capIds.has(s.capability),
          })),
        }
      );
    }),
    glossary,
    openQuestions,
    sources,
  };
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
