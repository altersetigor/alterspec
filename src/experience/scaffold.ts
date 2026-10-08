import { Document } from 'yaml';
import { esc } from '../prototype/render.js';
import type { FieldGroup, ScreenPage } from '../prototype/model.js';
import type { ExperienceScreen } from '../schemas/experience.js';
import type { SpecModel } from '../spec/model.js';
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

/** The experience screen markdown for a business screen. */
export function draftDoc(template: string, page: ScreenPage): string {
  const archetype = archetypeFor(page);
  const doc = new Document({
    id: `UX-${page.id}`,
    screen: page.id,
    status: 'draft',
    archetype,
    dry: dryHash(page),
    elements: draftElements(page, archetype),
    states: draftStates(page),
  });
  const body = template
    .slice(template.indexOf('\n---', 3) + 4)
    .replaceAll('{{SCREEN}}', page.id)
    .replaceAll('{{title}}', page.title);
  return `---\n${doc.toString({ lineWidth: 0 })}---${body}`;
}

const roleAttr = (narrowed: Map<string, string[]>, src: string, disabled = false) => {
  const r = narrowed.get(src);
  if (!r) return '';
  return ` data-roles="${esc(r.join(' '))}"${disabled ? ' data-unavailable="disabled"' : ''}`;
};

/** Badge tone for a lifecycle state, from its name. */
export function stateTone(state: string): string {
  if (/^(active|valid|approved|issued|published|done|completed|paid|open)$/.test(state)) return 'success';
  if (/^(draft|proposed|prospective|new|pending|requested|reserved|submitted)$/.test(state)) return 'info';
  if (/^(blocked|rejected|cancelled|canceled|failed|overdue)$/.test(state)) return 'danger';
  if (/^(expired|archived|discontinued|left|closed|withdrawn|inactive|sold)$/.test(state)) return 'muted';
  return 'neutral';
}

const badge = (state: string) => `<span class="ux-badge ux-badge-${stateTone(state)}">${esc(state)}</span>`;

/** Markup of one element group, using kit classes only. */
function groupHtml(g: FieldGroup, narrowed: Map<string, string[]>): string {
  const head = `<section class="ux-card ux-data" data-src="${esc(g.src)}"${roleAttr(narrowed, g.src)}>\n<h2 class="ux-card-title">${esc(g.entityTitle)}</h2>`;
  if (g.mode === 'list') {
    return [
      head,
      '<table class="ux-table">',
      `<thead><tr>${g.fields.map((f) => `<th data-src="${esc(f.src)}">${esc(f.name)}</th>`).join('')}${g.hasState ? '<th>Status</th>' : ''}</tr></thead>`,
      '<tbody>',
      ...g.records.map(
        (r) =>
          `<tr>${g.fields.map((f) => `<td>${esc(r.values[f.name] ?? '')}</td>`).join('')}${g.hasState ? `<td>${badge(r.state ?? '')}</td>` : ''}</tr>`,
      ),
      '</tbody>',
      '</table>',
      '</section>',
    ].join('\n');
  }
  const r = g.records[0];
  if (g.mode === 'view') {
    return [
      head,
      '<dl class="ux-detail-list">',
      ...g.fields.map(
        (f) =>
          `<div data-src="${esc(f.src)}" style="display:contents"><dt>${esc(f.name)}</dt><dd>${esc(r?.values[f.name] ?? '')}</dd></div>`,
      ),
      ...(g.hasState
        ? [`<div style="display:contents"><dt>Status</dt><dd>${badge(r?.state ?? '')}</dd></div>`]
        : []),
      '</dl>',
      '</section>',
    ].join('\n');
  }
  return [
    head,
    '<form class="ux-form">',
    ...g.fields.map((f, i) => {
      const id = `${g.entity}-${i + 1}`.toLowerCase();
      const v = r?.values[f.name] ?? '';
      const req = f.required ? ' <span class="ux-required">*</span>' : '';
      let input: string;
      if (f.kind === 'yes_no') input = `<input id="${id}" type="checkbox"${v === 'Yes' ? ' checked' : ''}>`;
      else if (f.kind === 'choice' || f.kind === 'reference') {
        const opts = f.options?.length
          ? f.options
          : [...new Set(g.records.map((x) => x.values[f.name] ?? ''))];
        input = `<select id="${id}" class="ux-input">${opts.map((o) => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      } else
        input = `<input id="${id}" class="ux-input" type="${INPUT_TYPE[f.kind] ?? 'text'}" value="${esc(v)}">`;
      return `<div class="ux-field" data-src="${esc(f.src)}"><label class="ux-label" for="${id}">${esc(f.name)}${req}</label>${input}</div>`;
    }),
    '</form>',
    '</section>',
  ].join('\n');
}

/** The mockup page for a business screen. */
export function draftMockup(page: ScreenPage, appTitle: string): string {
  const narrowed = narrowedRoles(page);
  const archetype = archetypeFor(page);
  const regions = new Map<string, string[]>();
  for (const g of page.groups) {
    const r = groupRegion(archetype, g, page);
    regions.set(r, [...(regions.get(r) ?? []), groupHtml(g, narrowed)]);
  }
  const region = (name: string, tag = 'div', extra = '') =>
    regions.has(name) || extra
      ? [
          `<${tag} class="ux-region" data-region="${name}">`,
          ...(regions.get(name) ?? []),
          ...(extra ? [extra] : []),
          `</${tag}>`,
        ]
      : [];
  /** Main content and, when there is one, a side column. */
  const columns = (main: string, side: string, mainExtra = '') => {
    const hasSide = regions.has(side);
    return [
      `<div class="ux-layout${hasSide ? '' : ' ux-layout-single'}">`,
      ...region(main, 'div', mainExtra),
      ...(hasSide ? region(side, 'aside') : []),
      '</div>',
    ];
  };
  const layout = () => {
    if (archetype === 'list') return columns('results', 'detail');
    if (archetype === 'editor')
      return columns(
        'form',
        'side',
        actions.length ? ['<div class="ux-actions ux-form-actions">', ...actions, '</div>'].join('\n') : '',
      );
    return [...region('summary'), ...columns('main', 'side')];
  };
  const states = draftStates(page).map((s) => s.id);
  const actions = page.actions.map(
    (a, i) =>
      `<button type="button" class="ux-button${i === 0 ? ' ux-button-primary' : ''}" data-src="${esc(a.src)}"${roleAttr(narrowed, a.src)} data-action="${esc(`${a.label}: performs ${a.capability}${a.capabilityTitle ? ` ${a.capabilityTitle}` : ''}`)}">${esc(a.label)}</button>`,
  );
  const stateHtml = page.states.map(
    (s) =>
      `<div class="ux-state${s.key === 'validation' ? ' ux-state-danger' : ''}" data-src="${esc(s.src)}" data-show-in="${s.key}">${esc(sentence(s.text ?? s.label))}</div>`,
  );
  return [
    '<!doctype html>',
    `<!-- Experience mockup of ${page.id}. Shape it freely, but keep every data-src, data-roles and data-show-in: the alignment checks read them. -->`,
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(page.title)} · ${esc(appTitle)}</title>`,
    '<link rel="stylesheet" href="kit/tokens.css">',
    '<link rel="stylesheet" href="kit/components.css">',
    '<script src="nav.js"></script>',
    '</head>',
    `<body data-screen="${esc(page.id)}" data-roles="${esc(page.roles.map((r) => r.id).join(' '))}" data-states="${esc(states.join(' '))}">`,
    `<main class="ux-page" data-src="${esc(page.src)}">`,
    '<header class="ux-page-header">',
    `<div><p class="ux-breadcrumb">${esc(page.module.title)}</p><h1 class="ux-page-title">${esc(page.title)}</h1></div>`,
    ...(archetype !== 'editor' && actions.length
      ? [`<div class="${archetype === 'list' ? 'ux-toolbar' : 'ux-actions'}">`, ...actions, '</div>']
      : []),
    '</header>',
    ...stateHtml,
    ...layout(),
    '</main>',
    '<script src="kit/shell.js"></script>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/** nav.js: application name, modules with their designed screens, and the demo users (one per role). */
export function navJs(model: SpecModel, designed: Set<string>): string {
  const m = dryModel(model);
  const data = {
    app: m.title,
    modules: m.modules
      .map((mod) => ({ title: mod.title, screens: mod.screens.filter((s) => designed.has(s.id)) }))
      .filter((mod) => mod.screens.length),
    roles: m.roles,
  };
  return `/* global window */\n// Written by \`alterspec experience\`: navigation and demo users. Don't edit; it is rewritten.\nwindow.UX_NAV = ${JSON.stringify(data, null, 2)};\n`;
}

/** index.html: the mockup launcher. */
export function indexHtml(appTitle: string): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(appTitle)}</title>`,
    '<link rel="stylesheet" href="kit/tokens.css">',
    '<link rel="stylesheet" href="kit/components.css">',
    '<script src="nav.js"></script>',
    '</head>',
    '<body>',
    '<main class="ux-page">',
    '<h1 class="ux-page-title" id="ux-title"></h1>',
    '<p>Mockups of the screens designed so far. Pick a screen on the left, and a demo user and a state at the top.</p>',
    '</main>',
    '<script>document.getElementById("ux-title").textContent = window.UX_NAV.app;</script>',
    '<script src="kit/shell.js"></script>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}
