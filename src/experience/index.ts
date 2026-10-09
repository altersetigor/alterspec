import type { ExperienceScreen } from '../schemas/experience.js';
import type { LocatedDoc, SpecModel } from '../spec/model.js';
import { blockHash } from '../views/blocks.js';
import { elementRoles } from '../wireframe/index.js';
import { buildWireframe, type WireframeModel, type ScreenPage } from '../wireframe/model.js';

export const EXPERIENCE_DIR = 'experience';
export const mockupPath = (screenId: string) => `${EXPERIENCE_DIR}/mockups/${screenId}.html`;
export const experiencePath = (screenId: string) => `${EXPERIENCE_DIR}/screens/UX-${screenId}.md`;

/** Whether the project has an experience layer at all. */
export const hasExperience = (model: SpecModel) =>
  model.raw.some((f) => f.path.startsWith(`${EXPERIENCE_DIR}/`));

const cache = new WeakMap<SpecModel, WireframeModel>();
/** The generated (dry) wireframe of the spec, computed once per model. */
export function dryModel(model: SpecModel): WireframeModel {
  let m = cache.get(model);
  if (!m) {
    m = buildWireframe(model);
    cache.set(model, m);
  }
  return m;
}

export const dryPage = (model: SpecModel, screenId: string): ScreenPage | undefined =>
  dryModel(model).screens.find((s) => s.id === screenId);

/**
 * Fingerprint of what an experience screen realises: its elements, their audience, field kinds and options, action
 * captions and the business state texts. Mock data, capability wording and navigation don't count.
 */
export const dryHash = (page: ScreenPage) =>
  blockHash(
    JSON.stringify({
      id: page.id,
      title: page.title,
      roles: page.roles.map((r) => r.id),
      groups: page.groups.map((g) => ({
        src: g.src,
        mode: g.mode,
        roles: g.roles,
        fields: g.fields.map((f) => [f.src, f.kind, f.required, f.options ?? []]),
      })),
      actions: page.actions.map((a) => [a.src, a.label, a.capability, a.roles]),
      states: page.states.map((s) => [s.src, s.text ?? '']),
    }),
  );

/**
 * The business elements an experience screen must realise: the screen itself, its data groups and fields, its
 * actions and its business states. Roles, entry points and gaps are not UI elements of a real screen.
 */
export function uxElements(page: ScreenPage): string[] {
  return [
    page.src,
    ...page.groups.flatMap((g) => [g.src, ...g.fields.map((f) => f.src)]),
    ...page.actions.map((a) => a.src),
    ...page.states.map((s) => s.src),
  ];
}

/** Data groups and actions whose audience is narrower than the screen's roles (fields follow their group). */
export function narrowedRoles(page: ScreenPage): Map<string, string[]> {
  const screen = page.roles
    .map((r) => r.id)
    .sort()
    .join(' ');
  const roles = elementRoles(page);
  const out = new Map<string, string[]>();
  for (const src of [...page.groups.map((g) => g.src), ...page.actions.map((a) => a.src)]) {
    const r = roles[src] ?? [];
    if (r.join(' ') !== screen) out.set(src, r);
  }
  return out;
}

/** Fingerprint of an experience screen and its mockup, ignoring the `reviewed:` line itself. */
export function reviewHash(screenDoc: string, mockup: string | undefined): string {
  const doc = screenDoc.replace(/^reviewed:.*\n/m, '');
  return blockHash(`${doc}\u0000${mockup ?? ''}`);
}

export const contentOf = (model: SpecModel, path: string) => model.raw.find((f) => f.path === path)?.content;

export type ExperienceDoc = LocatedDoc<ExperienceScreen>;
