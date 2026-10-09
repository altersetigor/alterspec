import { Document } from 'yaml';
import { esc } from '../prototype/render.js';
import type { FieldGroup, ScreenPage } from '../prototype/model.js';
import type { ExperienceScreen } from '../schemas/experience.js';
import type { SpecModel } from '../spec/model.js';
import { blockHash } from '../views/blocks.js';
import { SCRIPTS } from './app.js';
import { dryHash, dryModel, narrowedRoles } from './index.js';

/**
 * First drafts of an experience screen and its mockup, built from the business screen so they already pass every
 * alignment check. The designer then shapes layout, components and wording; the checks keep them aligned.
 */

type Element = ExperienceScreen['elements'][number];

const FIELD_COMPONENT: Record<string, string> = {
  text: 'field-text',
  number: 'field-number',
  amount: 'field-amount',
  date: 'field-date',
  period: 'field-period',
  yes_no: 'field-checkbox',
  choice: 'field-select',
  reference: 'field-reference',
  document: 'field-document',
  other: 'field-text',
};

const INPUT_TYPE: Record<string, string> = {
  number: 'number',
  amount: 'number',
  date: 'date',
  period: 'month',
};

/** Messages start with a capital letter. */
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const STATE_COMPONENT = {
  empty: 'empty-state',
  'no-permission': 'permission-state',
  validation: 'validation-summary',
} as const;

/** Many records → list; entering data → editor; otherwise one record → detail. */
export function archetypeFor(page: ScreenPage): string {
  if (page.groups.some((g) => g.mode === 'list')) return 'list';
  if (page.groups.some((g) => g.mode === 'edit')) return 'editor';
  return 'detail';
}

/** Region of the archetype that holds a data group (the first view group of a detail is its summary). */
function groupRegion(archetype: string, g: FieldGroup, page: ScreenPage): string {
  if (archetype === 'list') return g.mode === 'list' ? 'results' : 'detail';
  if (archetype === 'editor') return g.mode === 'edit' ? 'form' : 'side';
  if (archetype === 'detail') {
    if (g === page.groups.find((x) => x.mode === 'view')) return 'summary';
    return g.mode === 'edit' ? 'side' : 'main';
  }
  return 'main';
}

const actionRegion = (archetype: string) => (archetype === 'list' ? 'toolbar' : 'actions');

export function draftElements(page: ScreenPage, archetype = archetypeFor(page)): Element[] {
  const narrowed = narrowedRoles(page);
  const out: Element[] = [{ src: page.src, region: 'header', component: 'page-title', label: page.title }];
  for (const g of page.groups) {
    const region = groupRegion(archetype, g, page);
    out.push({
      src: g.src,
      region,
      component: g.mode === 'list' ? 'data-table' : g.mode === 'view' ? 'detail-list' : 'section',
      label: g.entityTitle,
    });
    for (const f of g.fields) {
      out.push({
        src: f.src,
        region,
        component:
          g.mode === 'list' ? 'table-column' : g.mode === 'view' ? 'value' : FIELD_COMPONENT[f.kind]!,
        label: f.name,
      });
    }
  }
  page.actions.forEach((a, i) =>
    out.push({
      src: a.src,
      region: actionRegion(archetype),
      component: i === 0 ? 'button-primary' : 'button-secondary',
      label: a.label,
      ...(narrowed.has(a.src) ? { unavailable: 'hidden' as const } : {}),
    }),
  );
  for (const s of page.states)
    out.push({
      src: s.src,
      region: 'messages',
      component: STATE_COMPONENT[s.key],
      label: sentence(s.text ?? s.label),
    });
  return out;
}

export function draftStates(page: ScreenPage): ExperienceScreen['states'] {
  const first = page.roles[0]?.id;
  const out: ExperienceScreen['states'] = page.roles.map((r, i) => ({
    id: i === 0 ? 'default' : `default-${r.id.slice(5).toLowerCase()}`,
    as: r.id,
  }));
  for (const s of page.states)
    out.push({ id: s.key, ...(first && s.key !== 'no-permission' ? { as: first } : {}) });
  return out;
}

/** Fingerprint of a rendered page, recorded in the contract as `page:`. */
export const pageHash = (html: string) => blockHash(html);

/** The experience screen markdown for a business screen; `mockup` is the page rendered for it. */
export function draftDoc(template: string, page: ScreenPage, mockup?: string): string {
  const archetype = archetypeFor(page);
  const doc = new Document({
    id: `UX-${page.id}`,
    screen: page.id,
    status: 'draft',
    archetype,
    dry: dryHash(page),
    ...(mockup === undefined ? {} : { page: pageHash(mockup) }),
    elements: draftElements(page, archetype),
    states: draftStates(page),
  });
  const body = template
    .slice(template.indexOf('\n---', 3) + 4)
    .replaceAll('{{SCREEN}}', page.id)
    .replaceAll('{{title}}', page.title);
  return `---\n${doc.toString({ lineWidth: 0 })}---${body}`;
}

/** The contract a mockup is rendered from: a draft, or an existing experience screen. */
export interface Contract {
  archetype: string;
  elements: Element[];
  states: ExperienceScreen['states'];
}

export const draftContract = (page: ScreenPage): Contract => {
  const archetype = archetypeFor(page);
  return { archetype, elements: draftElements(page, archetype), states: draftStates(page) };
};

const attr = (name: string, value: string | undefined) =>
  value === undefined ? '' : ` ${name}="${esc(value)}"`;

interface Effect {
  op: 'create' | 'update' | 'transition' | 'archive' | 'delete';
  entity: string;
  from?: string;
  to?: string;
  confirm?: string;
  toast: string;
  show?: string;
  back?: string;
  /** Scope per role from the capability: `own` means only on the person's own records. */
  scopes?: Record<string, string>;
}

/** A screen that shows one record of the entity and is reached from `from` (or `from` itself). */
function recordScreen(model: SpecModel, entity: string, from: ScreenPage): string | undefined {
  const pages = dryModel(model).screens;
  const shows = (p: ScreenPage, mode: string) => p.groups.some((g) => g.entity === entity && g.mode === mode);
  const reachedFrom = (p: ScreenPage) =>
    p.id !== from.id && model.screens.get(p.id)?.data.entry_points.includes(from.id);
  // Prefer the screen that shows the record over the one that edits it.
  const reached =
    pages.find((p) => reachedFrom(p) && shows(p, 'view')) ??
    pages.find((p) => reachedFrom(p) && shows(p, 'edit'));
  if (reached) return reached.id;
  const shown = pages.find((p) => p.id !== from.id && shows(p, 'view') && p.groups[0]?.entity === entity);
  if (shown) return shown.id;
  if (shows(from, 'view') || shows(from, 'edit')) return from.id;
  return undefined;
}

/** What an action does to the demo data, from its capability's operations and transitions. */
function effectOf(model: SpecModel, page: ScreenPage, capId: string): Effect | undefined {
  const cap = model.capabilities.get(capId);
  if (!cap) return undefined;
  const onPage = new Set(page.groups.map((g) => g.entity));
  const use = cap.data.entities.find((e) => onPage.has(e.entity)) ?? cap.data.entities[0];
  if (!use) return undefined;
  const entity = model.entities.get(use.entity);
  const title = entity?.data.title ?? use.entity;
  const back = model.screens.get(page.id)?.data.entry_points.find((e) => model.screens.has(e));
  const owned = cap.data.roles.filter((r) => r.scope === 'own');
  const scopes = owned.length ? { scopes: Object.fromEntries(owned.map((r) => [r.role, r.scope])) } : {};
  if (use.ops.includes('C')) {
    const show = recordScreen(model, use.entity, page);
    return { op: 'create', entity: use.entity, toast: `${title} created`, ...(show ? { show } : {}) };
  }
  const transition = use.transitions[0];
  if (transition) {
    const [from, to] = transition.split('->') as [string, string];
    const final = !(entity?.data.transitions ?? []).some((t) => t.from === to);
    return {
      op: 'transition',
      entity: use.entity,
      from,
      to,
      toast: `${title} ${to.replace(/_/g, ' ')}`,
      ...(final ? { confirm: `${sentence(cap.data.title)}?` } : {}),
      ...scopes,
    };
  }
  if (use.ops.includes('U')) return { op: 'update', entity: use.entity, toast: 'Changes saved', ...scopes };
  if (use.ops.includes('A') || use.ops.includes('D')) {
    const archived = entity?.data.states.find((s) => /archiv/.test(s));
    return {
      op: archived ? 'archive' : 'delete',
      entity: use.entity,
      ...(archived ? { to: archived } : {}),
      confirm: `${sentence(cap.data.title)}?`,
      toast: `${title} ${archived ? 'archived' : 'deleted'}`,
      ...(back ? { back } : {}),
      ...scopes,
    };
  }
  return undefined;
}

const words = (id: string) => id.replace(/-/g, ' ');

/** A state the designer added (loading, error, a confirmation…), drawn the way the app would show it. */
function designState(id: string): string {
  if (/^loading/.test(id))
    return `<div class="ux-card ux-skeleton" data-show-in="${esc(id)}" aria-busy="true"><span></span><span></span><span></span></div>`;
  if (/error|fail/.test(id))
    return `<div class="ux-state ux-state-danger" data-show-in="${esc(id)}"><i data-icon="alert-triangle"></i>Something went wrong. Please try again. <button type="button" class="ux-button">Try again</button></div>`;
  if (/^confirm/.test(id)) {
    const what = sentence(words(id.replace(/^confirm-?/, '')) || 'continue');
    return `<div class="ux-overlay" data-show-in="${esc(id)}"><div class="ux-dialog-static" role="dialog" aria-modal="true"><h2 class="ux-dialog-title">${esc(what)}?</h2><p>This can't be undone.</p><div class="ux-dialog-actions"><button type="button" class="ux-button">Cancel</button><button type="button" class="ux-button ux-button-primary">${esc(what)}</button></div></div></div>`;
  }
  return `<div class="ux-state" data-show-in="${esc(id)}"><i data-icon="info"></i>${esc(sentence(words(id)))}</div>`;
}

const ICON_FOR_STATE: Record<string, string> = {
  empty: 'inbox',
  'no-permission': 'lock',
  validation: 'alert-circle',
};

function fieldError(kind: string, name: string): string {
  const what = name.toLowerCase();
  return kind === 'choice' || kind === 'reference' ? `Choose ${what}.` : `Enter ${what}.`;
}

/** Markup of one data group, bound to the demo data by the kit at runtime. */
function groupHtml(
  model: SpecModel,
  page: ScreenPage,
  g: FieldGroup,
  labels: Map<string, string>,
  narrowed: Map<string, string[]>,
): string {
  const label = (src: string, fallback: string) => labels.get(src) ?? fallback;
  const entity = model.entities.get(g.entity)?.data;
  const attrs = new Map((entity?.attributes ?? []).map((a) => [a.name, a]));
  const image = (name: string) => /photo|image|picture|logo|avatar|thumbnail|cover/i.test(name);
  const roles = narrowed.get(g.src);
  const scopes = JSON.stringify(
    Object.fromEntries(
      page.roles.map((r) => [r.id, r.scope]).filter((x): x is [string, string] => Boolean(x[1])),
    ),
  );
  const open = (extra: string) =>
    `<section class="ux-card ux-data" data-src="${esc(g.src)}" data-entity="${esc(g.entity)}"${extra}${roles ? ` data-roles="${esc(roles.join(' '))}"` : ''}>`;
  const title = `<div class="ux-card-head"><h2 class="ux-card-title">${esc(label(g.src, g.entityTitle))}${g.mode === 'list' ? '<span class="ux-count" data-count></span>' : ''}</h2></div>`;

  if (g.mode === 'list') {
    const href = recordScreen(model, g.entity, page);
    const cells = g.fields.map((f, i) =>
      image(f.name)
        ? `<td><span class="ux-thumb" data-field-img="${esc(f.name)}"></span></td>`
        : `<td${i === 0 ? ' class="ux-cell-main"' : ''} data-field="${esc(f.name)}"></td>`,
    );
    return [
      open(` data-list${attr('data-scope', scopes === '{}' ? undefined : scopes)}`),
      title,
      '<table class="ux-table">',
      `<thead><tr>${g.fields.map((f) => `<th data-src="${esc(f.src)}">${esc(label(f.src, f.name))}</th>`).join('')}${g.hasState ? '<th>Status</th>' : ''}</tr></thead>`,
      '<tbody data-rows></tbody>',
      '</table>',
      `<template data-row><tr${attr('data-href', href ? `${href}.html` : undefined)}>${cells.join('')}${g.hasState ? '<td><span data-field-state></span></td>' : ''}</tr></template>`,
      '</section>',
    ].join('\n');
  }

  if (g.mode === 'view') {
    const pics = g.fields.filter((f) => image(f.name));
    const rest = g.fields.filter((f) => !image(f.name));
    return [
      open(' data-record'),
      title,
      ...pics.map((f) =>
        /profile|avatar|portrait/i.test(f.name)
          ? `<figure class="ux-figure ux-figure-avatar" data-src="${esc(f.src)}"><span class="ux-avatar-photo" data-field-img="${esc(f.name)}"></span><figcaption class="ux-sr-only">${esc(label(f.src, f.name))}</figcaption></figure>`
          : `<figure class="ux-figure" data-src="${esc(f.src)}"><figcaption class="ux-sr-only">${esc(label(f.src, f.name))}</figcaption><div class="ux-gallery" data-field-gallery="${esc(f.name)}"></div></figure>`,
      ),
      '<dl class="ux-detail-list">',
      ...rest.map(
        (f) =>
          `<div data-src="${esc(f.src)}" style="display:contents"><dt>${esc(label(f.src, f.name))}</dt><dd data-field="${esc(f.name)}"></dd></div>`,
      ),
      ...(g.hasState
        ? ['<div style="display:contents"><dt>Status</dt><dd><span data-field-state></span></dd></div>']
        : []),
      '</dl>',
      '</section>',
    ].join('\n');
  }

  return [
    open(' data-record'),
    title,
    '<form class="ux-form" novalidate>',
    ...g.fields.map((f, i) => {
      const a = attrs.get(f.name);
      const id = `${g.entity}-${i + 1}`.toLowerCase();
      const text = label(f.src, f.name);
      const req = f.required ? ' required' : '';
      const mark = f.required ? ' <span class="ux-required">*</span>' : '';
      let input: string;
      if (f.kind === 'yes_no') input = `<input id="${id}" name="${esc(f.name)}" type="checkbox">`;
      else if (f.kind === 'reference' && a?.references)
        input = `<select id="${id}" class="ux-input" name="${esc(f.name)}" data-references="${esc(a.references)}"${req}></select>`;
      else if (f.kind === 'choice')
        input = `<select id="${id}" class="ux-input" name="${esc(f.name)}"${req}><option value=""></option>${(f.options ?? []).map((o) => `<option>${esc(o)}</option>`).join('')}</select>`;
      else if (/description|note|comment|reason|details|message|bio/i.test(f.name))
        input = `<textarea id="${id}" class="ux-input" name="${esc(f.name)}"${req}></textarea>`;
      else if (image(f.name))
        input = `<div class="ux-upload"><div class="ux-gallery ux-gallery-small" data-field-gallery="${esc(f.name)}"></div><label class="ux-button ux-upload-button"><i data-icon="camera"></i>Add photos<input id="${id}" type="file" accept="image/*" multiple name="${esc(f.name)}" data-image${req} hidden></label></div>`;
      else
        input = `<input id="${id}" class="ux-input" name="${esc(f.name)}" type="${INPUT_TYPE[f.kind] ?? 'text'}"${f.kind === 'amount' ? ' step="0.01"' : ''}${req}>`;
      return `<div class="ux-field" data-src="${esc(f.src)}"><label class="ux-label" for="${id}">${esc(text)}${mark}</label>${input}${f.required ? `<p class="ux-field-error">${esc(fieldError(f.kind, text))}</p>` : ''}</div>`;
    }),
    '</form>',
    '</section>',
  ].join('\n');
}

/**
 * The mockup page of a screen: an application page bound to the demo data. Rendered from a contract (a draft or an
 * existing experience screen) so labels, regions and components follow it.
 */
export function draftMockup(
  model: SpecModel,
  page: ScreenPage,
  contract: Contract = draftContract(page),
): string {
  const narrowed = narrowedRoles(page);
  const labels = new Map(contract.elements.map((e) => [e.src, e.label]));
  const region = new Map(contract.elements.map((e) => [e.src, e.region]));
  const component = new Map(contract.elements.map((e) => [e.src, e.component]));
  const archetype = contract.archetype;

  const actions = page.actions.map((a, i) => {
    const fx = effectOf(model, page, a.capability);
    const comp = component.get(a.src) ?? (i === 0 ? 'button-primary' : 'button-secondary');
    const cls =
      comp === 'button-primary' ? ' ux-button-primary' : comp === 'button-danger' ? ' ux-button-danger' : '';
    const el = contract.elements.find((e) => e.src === a.src);
    const gate = narrowed.get(a.src);
    return (
      `<button type="button" class="ux-button${cls}" data-src="${esc(a.src)}"` +
      (gate ? ` data-roles="${esc(gate.join(' '))}"` : '') +
      (el?.unavailable === 'disabled'
        ? ` data-unavailable="disabled"${attr('data-reason', el.reason)}`
        : '') +
      (fx ? ` data-effect="${esc(JSON.stringify(fx))}"` : '') +
      `>${esc(labels.get(a.src) ?? a.label)}</button>`
    );
  });

  const regions = new Map<string, string[]>();
  for (const g of page.groups) {
    const r = region.get(g.src) ?? 'main';
    regions.set(r, [...(regions.get(r) ?? []), groupHtml(model, page, g, labels, narrowed)]);
  }
  const block = (name: string, tag = 'div', extra: string[] = []) =>
    regions.has(name) || extra.length
      ? [
          `<${tag} class="ux-region" data-region="${name}">`,
          ...(regions.get(name) ?? []),
          ...extra,
          `</${tag}>`,
        ]
      : [];
  const columns = (main: string, side: string, extra: string[] = []) => {
    const hasSide = regions.has(side);
    return [
      `<div class="ux-layout${hasSide ? '' : ' ux-layout-single'}">`,
      ...block(main, 'div', extra),
      ...(hasSide ? block(side, 'aside') : []),
      '</div>',
    ];
  };
  const formActions = actions.length
    ? ['<div class="ux-actions ux-form-actions">', ...actions, '</div>']
    : [];
  const layout =
    archetype === 'list'
      ? columns('results', 'detail')
      : archetype === 'editor'
        ? columns('form', 'side', formActions)
        : [...block('summary'), ...columns('main', 'side')];
  const used = new Set(
    archetype === 'list'
      ? ['results', 'detail']
      : archetype === 'editor'
        ? ['form', 'side']
        : ['summary', 'main', 'side'],
  );
  const others = [...regions.keys()].filter((r) => !used.has(r)).flatMap((r) => block(r));
  const business = new Set<string>(page.states.map((s) => s.key));
  const designStates = contract.states
    .filter((s) => !/^default(-|$)/.test(s.id) && !business.has(s.id))
    .map((s) => designState(s.id));

  const states = page.states.map((s) => {
    const text = labels.get(s.src) ?? sentence(s.text ?? s.label);
    return `<div class="ux-state${s.key === 'validation' ? ' ux-state-danger' : ''}" data-src="${esc(s.src)}" data-show-in="${s.key}"><i data-icon="${ICON_FOR_STATE[s.key]}"></i>${esc(text)}</div>`;
  });
  const stateIds = contract.states.map((s) => s.id);
  const appTitle = dryModel(model).title;

  return [
    '<!doctype html>',
    `<!-- ${page.id}: keep every data-src, data-roles and data-show-in; the alignment checks read them. -->`,
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(labels.get(page.src) ?? page.title)} · ${esc(appTitle)}</title>`,
    '<link rel="stylesheet" href="kit/tokens.css">',
    '<link rel="stylesheet" href="kit/components.css">',
    '</head>',
    `<body data-screen="${esc(page.id)}" data-roles="${esc(page.roles.map((r) => r.id).join(' '))}" data-states="${esc(stateIds.join(' '))}">`,
    `<main class="ux-page" data-src="${esc(page.src)}">`,
    '<header class="ux-page-header">',
    `<div><nav class="ux-breadcrumb" aria-label="Breadcrumb"><span>${esc(page.module.title)}</span><i data-icon="chevron-right"></i><span>${esc(labels.get(page.src) ?? page.title)}</span><i data-icon="chevron-right" data-crumb-record hidden></i><span data-crumb-record hidden></span></nav>`,
    `<h1 class="ux-page-title">${esc(labels.get(page.src) ?? page.title)}</h1></div>`,
    ...(archetype !== 'editor' && actions.length
      ? [`<div class="${archetype === 'list' ? 'ux-toolbar' : 'ux-actions'}">`, ...actions, '</div>']
      : []),
    '</header>',
    ...states,
    ...layout,
    ...others,
    ...designStates,
    '</main>',
    ...SCRIPTS,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}
