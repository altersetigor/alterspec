/**
 * Lifting: what a hand-edited experience needs from the business spec, and where in the spec tree it goes.
 *
 * Information flows one way, business spec → wireframe → experience, and nothing climbs back on its own. But every
 * business element of a page carries a `data-src` whose grammar says where it lives (`SCR.ENT-X.Attr` is a field of
 * entity X, `SCR.A03` an action, `SCR.role.ROLE-Y` a role, `SCR.entry.N` an entry point). So for every marker the
 * spec lacks, the path up the tree is deterministic: which objects, at which levels, under which names, and which
 * check would fire if a level were skipped. What each object must *say* (a business kind, which capability, a scope)
 * is a product decision and is listed to confirm, never guessed.
 */
import { ID_REGEX } from '../schemas/ids.js';
import type { ExperienceScreen } from '../schemas/experience.js';
import type { SpecModel } from '../spec/model.js';
import type { ScreenPage } from '../wireframe/model.js';
import { elementText, normalize, tags } from './html.js';
import { uxElements } from './index.js';

export type LiftLevel = 'screen' | 'entity' | 'capability' | 'module' | 'application';

export interface LiftStep {
  level: LiftLevel;
  /** The object to edit (an ID), or `new <kind>` when one must be created. */
  object: string;
  /** What must be written there, in one sentence. */
  edit: string;
  /** The check that fires while this step is missing. */
  check: string;
}

export interface LiftItem {
  /** The marker the spec lacks. */
  src: string;
  kind: 'group' | 'field' | 'action' | 'role' | 'entry' | 'unknown';
  /** The text people see: the contract's label, else the page element's text. */
  label?: string;
  where: 'page' | 'contract' | 'both';
  /** The path up the tree, in working order: screen first. */
  steps: LiftStep[];
  /** Existing objects that may already be what was meant (an attribute spelled differently, a capability). */
  candidates?: string[];
  /** Facts only the person can give. */
  confirm: string[];
  /** For `unknown` items: why it can't be lifted. */
  note?: string;
}

export interface Lift {
  screen: string;
  title: string;
  items: LiftItem[];
  /** The idea for the analyst's proposal mode, as a deterministic paragraph; empty without items. */
  brief: string;
}

const KINDS = 'text, number, amount, date, period, yes_no, choice, reference, document';

/** Markers of the page and of the contract that the business screen doesn't have, with where each one was found. */
function foreignMarkers(page: ScreenPage, x: ExperienceScreen, html: string): Map<string, LiftItem['where']> {
  const expected = new Set(uxElements(page));
  const onPage = new Set(tags(html).flatMap((t) => (t.attrs['data-src'] ? [t.attrs['data-src']] : [])));
  const inContract = new Set(x.elements.map((e) => e.src));
  const out = new Map<string, LiftItem['where']>();
  for (const src of [...onPage, ...inContract].sort()) {
    if (expected.has(src) || out.has(src)) continue;
    out.set(src, onPage.has(src) && inContract.has(src) ? 'both' : onPage.has(src) ? 'page' : 'contract');
  }
  return out;
}

function labelOf(src: string, x: ExperienceScreen, html: string): string | undefined {
  const declared = x.elements.find((e) => e.src === src)?.label;
  if (declared) return declared;
  const tag = tags(html).find((t) => t.attrs['data-src'] === src);
  const text = tag && elementText(html, tag);
  return text || undefined;
}

export function liftOf(model: SpecModel, page: ScreenPage, x: ExperienceScreen, html: string): Lift {
  const screen = model.screens.get(page.id);
  const items: LiftItem[] = [];
  for (const [src, where] of foreignMarkers(page, x, html)) {
    const label = labelOf(src, x, html);
    const base = { src, where, ...(label ? { label } : {}) };
    const rest = src.startsWith(`${page.id}.`) ? src.slice(page.id.length + 1) : undefined;
    if (rest === undefined) {
      items.push({
        ...base,
        kind: 'unknown',
        steps: [],
        confirm: [],
        note: `not a marker of ${page.id}: every data-src of this page starts with "${page.id}."`,
      });
      continue;
    }
    const q = label ? `"${label}"` : src;
    const entityField = /^(ENT-[A-Z0-9-]+)(?:\.(.+))?$/.exec(rest);
    if (entityField) {
      const entityId = entityField[1]!;
      const attr = entityField[2];
      const entity = model.entities.get(entityId);
      const group = screen?.data.fields.find((f) => f.entity === entityId);
      const steps: LiftStep[] = [];
      const confirm: string[] = [];
      let candidates: string[] | undefined;
      if (attr === undefined) {
        steps.push({
          level: 'screen',
          object: page.id,
          edit: `add a \`fields\` entry for ${entityId}: the attributes shown and the mode (list, view or edit)`,
          check: 'experience-mockup',
        });
        confirm.push(
          `which attributes of ${entityId} the screen shows, and in which mode (list, view, edit)`,
          'which screen roles see the data, if not all',
        );
      } else {
        steps.push({
          level: 'screen',
          object: page.id,
          edit: group
            ? `add "${attr}" to the ${entityId} attributes in \`fields\``
            : `add a \`fields\` entry for ${entityId} with "${attr}" and the mode (list, view or edit)`,
          check: 'experience-mockup',
        });
        if (!group) confirm.push(`the mode the screen shows ${entityId} in (list, view, edit)`);
      }
      if (!entity) {
        steps.push({
          level: 'entity',
          object: `new entity ${entityId}`,
          edit: `create ${entityId} with its attributes (business kinds), relationships and lifecycle`,
          check: 'unknown-reference',
        });
        confirm.push(`the title, attributes and lifecycle of the new entity ${entityId}`);
      } else if (attr !== undefined && !entity.data.attributes.some((a) => a.name === attr)) {
        const similar = entity.data.attributes
          .filter((a) => normalize(a.name) === normalize(attr))
          .map((a) => `${entityId} attribute "${a.name}"`);
        if (similar.length) candidates = similar;
        steps.push({
          level: 'entity',
          object: entityId,
          edit: `add the attribute "${attr}" (business kind, required or not, options or the entity it references)`,
          check: 'screen-field-attribute',
        });
        if (similar.length) confirm.push(`whether ${q} is ${similar.join(' / ')} spelled differently`);
        confirm.push(
          `the business kind of ${q} (${KINDS})`,
          `whether ${q} is required`,
          `its options (choice) or the entity it references (reference)`,
        );
      }
      items.push({
        ...base,
        kind: attr === undefined ? 'group' : 'field',
        steps,
        ...(candidates ? { candidates } : {}),
        confirm,
      });
      continue;
    }
    if (ID_REGEX.screenAction.test(rest)) {
      const screenRoles = new Set(screen?.data.roles.map((r) => r.role) ?? []);
      const used = new Set(screen?.data.actions.map((a) => a.capability) ?? []);
      const candidates = [...model.capabilities.values()]
        .filter(
          (c) =>
            c.data.module === page.module.id &&
            !used.has(c.id) &&
            c.data.roles.some((r) => screenRoles.has(r.role)),
        )
        .map((c) => `${c.id} ${c.data.title}`)
        .sort();
      const steps: LiftStep[] = [
        {
          level: 'screen',
          object: page.id,
          edit: `add the action ${rest} ${q} to \`actions\` with the capability it performs`,
          check: 'screen-role-action',
        },
        {
          level: 'capability',
          object: candidates.length
            ? `one of ${candidates.length} candidates, or new capability`
            : 'new capability',
          edit: candidates.length
            ? `use an existing capability of ${page.module.id} one of the screen's roles may perform, or create one`
            : `create the capability in ${page.module.id}: title, roles with scope, entities and transitions, acceptance criteria`,
          check: 'unknown-reference',
        },
        {
          level: 'application',
          object: 'flow step',
          edit: 'a new capability needs a step in an existing flow, or a new flow',
          check: 'capability-without-flow',
        },
      ];
      items.push({
        ...base,
        kind: 'action',
        steps,
        ...(candidates.length ? { candidates } : {}),
        confirm: [
          candidates.length
            ? `which capability ${rest} ${q} performs: ${candidates.join(', ')}, or a new one`
            : `the new capability ${rest} ${q} performs: title, roles with scope, entities and transitions`,
          'the flow step that ties a new capability in',
        ],
      });
      continue;
    }
    const role = /^role\.(.+)$/.exec(rest);
    if (role) {
      const roleId = role[1]!;
      const known = model.roles.has(roleId);
      const steps: LiftStep[] = [
        {
          level: 'screen',
          object: page.id,
          edit: `add ${roleId} to \`roles\` (with a scope when it narrows what the role sees here)`,
          check: 'experience-mockup',
        },
      ];
      if (!known)
        steps.push({
          level: 'application',
          object: 'personas-roles.md',
          edit: `add the role ${roleId} (title, and the persona behind it)`,
          check: 'unknown-reference',
        });
      items.push({
        ...base,
        kind: 'role',
        steps,
        confirm: known
          ? [`the scope of ${roleId} on this screen (own, team, org, all), if narrowed`]
          : [`the title and persona of the new role ${roleId}`, `its scope on this screen, if narrowed`],
      });
      continue;
    }
    const entry = /^entry\.(\d+)$/.exec(rest);
    if (entry) {
      items.push({
        ...base,
        kind: 'entry',
        steps: [
          {
            level: 'screen',
            object: page.id,
            edit: `add entry point ${entry[1]} to \`entry_points\` (a screen ID or a situation)`,
            check: 'experience-mockup',
          },
        ],
        confirm: [`where people come from for entry point ${entry[1]}${label ? ` (${q})` : ''}`],
      });
      continue;
    }
    const state = /^state\.(.+)$/.exec(rest);
    items.push({
      ...base,
      kind: 'unknown',
      steps: [],
      confirm: [],
      note: state
        ? `"${state[1]}" is not a business state: the screen always has empty, no-permission and validation; a design state (loading, error…) is declared in the contract's \`states\` list and marked with data-show-in, not with a data-src`
        : `not a marker the wireframe produces (entity, entity.attribute, A<NN>, role.<ROLE>, entry.<N>)`,
    });
  }
  return { screen: page.id, title: page.title, items, brief: briefOf(model, page, items) };
}

/** The idea for the analyst, from the markers: names and IDs are fixed, nothing else is said. */
function briefOf(model: SpecModel, page: ScreenPage, items: LiftItem[]): string {
  const parts = items
    .filter((i) => i.kind !== 'unknown')
    .map((i) => {
      const q = i.label ? `"${i.label}"` : i.src;
      const rest = i.src.slice(page.id.length + 1);
      switch (i.kind) {
        case 'group': {
          const e = model.entities.get(rest);
          return e ? `data of ${e.data.title} (${rest})` : `data of a new entity ${rest}`;
        }
        case 'field': {
          const [entityId, attr] = [rest.slice(0, rest.indexOf('.')), rest.slice(rest.indexOf('.') + 1)];
          const e = model.entities.get(entityId);
          const has = e?.data.attributes.some((a) => a.name === attr);
          return `a field ${q} of ${e ? e.data.title : `a new entity ${entityId}`} (${
            !e
              ? `${entityId} does not exist`
              : has
                ? `${entityId} has it; the screen doesn't show it`
                : `${entityId} has no such attribute`
          })`;
        }
        case 'action':
          return `an action ${rest} ${q} (${i.candidates?.length ? `performing one of: ${i.candidates.join(', ')}, or a new capability` : `with no capability of ${page.module.id} to perform yet`})`;
        case 'role':
          return `a view for ${rest.slice('role.'.length)} (${model.roles.has(rest.slice('role.'.length)) ? 'not a role of the screen' : 'a role the application does not have'})`;
        case 'entry':
          return `an entry point ${rest.slice('entry.'.length)}${i.label ? ` ${q}` : ''}`;
        default:
          return '';
      }
    })
    .filter(Boolean);
  return parts.length
    ? `The mockup of ${page.id} (${page.title}) shows, and the spec lacks: ${parts.join('; ')}.`
    : '';
}

/** The lift as a Markdown table for the grooming document: marker, what, the path up the tree, to confirm. */
export function liftTable(lift: Lift): string {
  const rows = lift.items.map((i) => {
    const path =
      i.kind === 'unknown'
        ? (i.note ?? '')
        : i.steps.map((s) => `${s.level} (${s.object}): ${s.edit}`).join('; ');
    const cell = (s: string) => s.replace(/\|/g, '\\|');
    return `| \`${i.src}\` | ${i.kind}${i.label ? ` ${cell(`"${i.label}"`)}` : ''} | ${cell(path)} | ${cell(i.confirm.join('; '))} |`;
  });
  return ['| Marker | What | Path up the tree | To confirm |', '| --- | --- | --- | --- |', ...rows].join(
    '\n',
  );
}
