import type { Capability } from '../../schemas/capability.js';
import type { SpecModel, LocatedDoc } from '../../spec/model.js';
import type { Screen } from '../../schemas/screen.js';
import type { LintRule, RawFinding } from '../types.js';

const REFINED = new Set(['refined', 'ready', 'approved', 'implemented']);

/** Capabilities performed from the screen's actions. */
const actionCaps = (model: SpecModel, s: LocatedDoc<Screen>) =>
  s.data.actions.flatMap((a) => {
    const c = model.capabilities.get(a.capability);
    return c ? [c] : [];
  });

/** Capabilities that list the screen or are performed from it. */
const screenCaps = (model: SpecModel, s: LocatedDoc<Screen>) => {
  const caps = new Map(actionCaps(model, s).map((c) => [c.id, c]));
  for (const c of model.capabilities.values()) if (c.data.screens.includes(s.id)) caps.set(c.id, c);
  return [...caps.values()];
};

const ops = (c: LocatedDoc<Capability>, entity: string) =>
  c.data.entities.filter((e) => e.entity === entity).flatMap((e) => e.ops);

export const screenFieldAttribute: LintRule = {
  name: 'screen-field-attribute',
  severity: 'error',
  description: "A screen's fields name attributes the entity has.",
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const s of model.screens.values()) {
      s.data.fields.forEach((f, i) => {
        const entity = model.entities.get(f.entity);
        if (!entity) return;
        const names = new Set(entity.data.attributes.map((a) => a.name));
        f.attributes.forEach((name, j) => {
          if (!names.has(name)) {
            out.push({
              file: s.file,
              line: s.lineOf(['fields', i, 'attributes', j]),
              id: s.id,
              message: `${f.entity} has no attribute "${name}"`,
            });
          }
        });
      });
    }
    return out;
  },
};

export const screenFieldOp: LintRule = {
  name: 'screen-field-op',
  severity: 'warn',
  description:
    "A screen's fields are backed by its capabilities: edited data by an action that creates or updates it, shown data by a capability that uses it.",
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const s of model.screens.values()) {
      s.data.fields.forEach((f, i) => {
        if (!model.entities.has(f.entity)) return;
        const line = s.lineOf(['fields', i]);
        if (f.mode === 'edit') {
          if (!actionCaps(model, s).some((c) => ops(c, f.entity).some((o) => o === 'C' || o === 'U'))) {
            out.push({
              file: s.file,
              line,
              id: s.id,
              message: `${f.entity} is edited here, but no action's capability creates or updates it`,
            });
          }
        } else if (!screenCaps(model, s).some((c) => ops(c, f.entity).length > 0)) {
          out.push({
            file: s.file,
            line,
            id: s.id,
            message: `${f.entity} is shown here, but no capability on this screen uses it`,
          });
        }
      });
    }
    return out;
  },
};

export const screenRoleAction: LintRule = {
  name: 'screen-role-action',
  severity: 'warn',
  description:
    "A screen's actions and field groups match its roles: someone on the screen can perform each action, and narrowed roles are screen roles.",
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const s of model.screens.values()) {
      const screenRoles = new Set(s.data.roles.map((r) => r.role));
      s.data.actions.forEach((a, i) => {
        const cap = model.capabilities.get(a.capability);
        if (!cap) return;
        const capRoles = new Set(cap.data.roles.map((r) => r.role));
        if (![...capRoles].some((r) => screenRoles.has(r))) {
          out.push({
            file: s.file,
            line: s.lineOf(['actions', i]),
            id: s.id,
            message: `${a.id} performs ${cap.id}, but none of its roles is a role of this screen`,
          });
        }
        a.roles.forEach((r, j) => {
          if (!screenRoles.has(r) || !capRoles.has(r)) {
            out.push({
              file: s.file,
              line: s.lineOf(['actions', i, 'roles', j]),
              id: s.id,
              message: !screenRoles.has(r)
                ? `${a.id} is narrowed to ${r}, which is not a role of this screen`
                : `${a.id} is narrowed to ${r}, which cannot perform ${cap.id}`,
            });
          }
        });
      });
      s.data.fields.forEach((f, i) =>
        f.roles.forEach((r, j) => {
          if (!screenRoles.has(r)) {
            out.push({
              file: s.file,
              line: s.lineOf(['fields', i, 'roles', j]),
              id: s.id,
              message: `fields for ${f.entity} are narrowed to ${r}, which is not a role of this screen`,
            });
          }
        }),
      );
    }
    return out;
  },
};

export const screenFieldsMissing: LintRule = {
  name: 'screen-fields-missing',
  severity: 'warn',
  description: 'Screens that are refined or later list the data they show in `fields`.',
  check: ({ model }) =>
    [...model.screens.values()]
      .filter((s) => REFINED.has(s.data.status) && s.data.fields.length === 0)
      .map((s) => ({
        file: s.file,
        line: s.line,
        id: s.id,
        message: `${s.id} is ${s.data.status} but lists no fields`,
      })),
};

export const entityAttributeDetail: LintRule = {
  name: 'entity-attribute-detail',
  severity: 'warn',
  description:
    'Entities that are refined or later say which entity each reference attribute points to and which options each choice offers.',
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const e of model.entities.values()) {
      if (!REFINED.has(e.data.status)) continue;
      e.data.attributes.forEach((a, i) => {
        const missing =
          a.kind === 'reference' && !a.references
            ? 'which entity it references'
            : a.kind === 'choice' && !a.options
              ? 'its options'
              : undefined;
        if (missing) {
          out.push({
            file: e.file,
            line: e.lineOf(['attributes', i]),
            id: e.id,
            message: `${a.name} is a ${a.kind} attribute but doesn't say ${missing}`,
          });
        }
      });
    }
    return out;
  },
};
