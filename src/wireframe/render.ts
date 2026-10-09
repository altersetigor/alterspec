import type { FieldGroup, WireframeModel, ScreenPage } from './model.js';

/**
 * Renders the generic (dry) wireframe. Every business element carries a `data-src` marker with its spec ID; the
 * experience layer's mockups must carry the same markers. Elements keep `as-*` classes for state.css and app.js.
 */
type Hook =
  | 'body'
  | 'top'
  | 'app'
  | 'logo'
  | 'badge'
  | 'role'
  | 'role-select'
  | 'layout'
  | 'nav'
  | 'nav-heading'
  | 'nav-list'
  | 'nav-item'
  | 'nav-link'
  | 'nav-link-active'
  | 'main'
  | 'crumb'
  | 'title'
  | 'purpose'
  | 'meta'
  | 'gap'
  | 'bar'
  | 'state-button'
  | 'action'
  | 'actions'
  | 'state'
  | 'group'
  | 'group-title'
  | 'mode'
  | 'data'
  | 'table'
  | 'dl'
  | 'form'
  | 'field'
  | 'label'
  | 'input'
  | 'select'
  | 'check'
  | 'req'
  | 'dialog'
  | 'button'
  | 'index'
  | 'section-title';

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const pageFile = (screenId: string) => `${screenId}.html`;

const roles = (r: string[]) => `data-roles="${esc(r.join(' '))}"`;
const src = (s: string) => `data-src="${esc(s)}"`;

const INPUT_TYPE: Record<string, string> = {
  number: 'number',
  amount: 'number',
  date: 'date',
  period: 'month',
};

export interface RenderOptions {
  /** Comment placed after the doctype. */
  banner: string;
  /** App name shown in the header; defaults to the application title. */
  appName?: string;
  /** Logo path relative to the page. */
  logo?: string;
}

export function renderPages(m: WireframeModel, opts: RenderOptions): Map<string, string> {
  const c = (...hooks: Hook[]) => `class="${hooks.map((h) => 'as-' + h).join(' ')}"`;
  const appName = opts.appName ?? m.title;
  const pages = new Set(m.screens.map((s) => s.id));

  const head = (title: string) =>
    [
      '<!doctype html>',
      opts.banner,
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      `<title>${esc(title)} · ${esc(appName)}</title>`,
      '<link rel="stylesheet" href="base.css">',
      '<link rel="stylesheet" href="state.css">',
      '</head>',
    ].join('\n');

  const nav = (current?: string) =>
    [
      `<nav ${c('nav')}>`,
      ...m.modules.flatMap((mod) => [
        `<h2 ${c('nav-heading')}>${esc(mod.title)}</h2>`,
        `<ul ${c('nav-list')}>`,
        ...mod.screens.map(
          (s) =>
            `<li ${c('nav-item')}><a ${s.id === current ? c('nav-link-active') + ' aria-current="page"' : c('nav-link')} href="${pageFile(s.id)}">${esc(s.title)}</a></li>`,
        ),
        '</ul>',
      ]),
      '</nav>',
    ].join('\n');

  const top = () =>
    [
      `<header ${c('top')}>`,
      `<a ${c('app')} href="index.html">${opts.logo ? `<img ${c('logo')} src="${esc(opts.logo)}" alt="">` : ''}${esc(appName)}</a>`,
      `<span ${c('badge')}>Wireframe generated from the spec · mock data</span>`,
      `<label ${c('role')}>View as <select id="as-role" ${c('role-select')}>`,
      '<option value="">All roles</option>',
      ...m.roles.map((r) => `<option value="${esc(r.id)}">${esc(r.title)} (${esc(r.id)})</option>`),
      '</select></label>',
      '</header>',
    ].join('\n');

  /** Header, navigation and the open main element; `close` ends them. */
  const frame = (current: string | undefined, main: string) =>
    [top(), `<div ${c('layout')}>`, nav(current), main].join('\n');
  const close = ['</main>', '</div>'];

  const group = (g: FieldGroup) => {
    const modeLabel = { list: 'list', view: 'one record', edit: 'enter or change' }[g.mode];
    const out = [
      `<section ${c('group')} ${src(g.src)} ${roles(g.roles)}>`,
      `<h2 ${c('group-title')}>${esc(g.entityTitle)} <span ${c('mode')}>${modeLabel}</span></h2>`,
      `<div ${c('data')}>`,
    ];
    if (g.mode === 'list') {
      out.push(
        `<table ${c('table')}>`,
        '<thead><tr>',
        ...g.fields.map((f) => `<th ${src(f.src)}>${esc(f.name)}</th>`),
        ...(g.hasState ? ['<th>State</th>'] : []),
        '</tr></thead>',
        '<tbody>',
        ...g.records.map(
          (r) =>
            '<tr>' +
            g.fields.map((f) => `<td>${esc(r.values[f.name] ?? '')}</td>`).join('') +
            (g.hasState ? `<td>${esc(r.state ?? '')}</td>` : '') +
            '</tr>',
        ),
        '</tbody>',
        '</table>',
      );
    } else if (g.mode === 'view') {
      const r = g.records[0];
      out.push(
        `<dl ${c('dl')}>`,
        ...g.fields.map(
          (f) => `<div ${src(f.src)}><dt>${esc(f.name)}</dt><dd>${esc(r?.values[f.name] ?? '')}</dd></div>`,
        ),
        ...(g.hasState ? [`<div><dt>State</dt><dd>${esc(r?.state ?? '')}</dd></div>`] : []),
        '</dl>',
      );
    } else {
      const r = g.records[0];
      out.push(`<form ${c('form')}>`);
      g.fields.forEach((f, i) => {
        const id = `${g.entity}-${i + 1}`;
        const v = r?.values[f.name] ?? '';
        const req = f.required ? ` <span ${c('req')}>*</span>` : '';
        let input: string;
        if (f.kind === 'yes_no') {
          input = `<input id="${esc(id)}" type="checkbox" ${c('check')}${v === 'Yes' ? ' checked' : ''}>`;
        } else if (f.kind === 'choice' || f.kind === 'reference') {
          const opts = f.kind === 'choice' && f.options?.length ? f.options : unique(g, f.name);
          input =
            `<select id="${esc(id)}" ${c('select')}>` +
            opts.map((o) => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`).join('') +
            '</select>';
        } else {
          const type = INPUT_TYPE[f.kind] ?? 'text';
          const step = f.kind === 'amount' ? ' step="0.01"' : '';
          input = `<input id="${esc(id)}" type="${type}"${step} value="${esc(v)}" ${c('input')}>`;
        }
        out.push(
          `<div ${c('field')} ${src(f.src)}><label for="${esc(id)}" ${c('label')}>${esc(f.name)}${req}</label>${input}</div>`,
        );
      });
      if (g.hasState) out.push(`<p ${c('crumb')}>State: ${esc(r?.state ?? '')}</p>`);
      out.push('</form>');
    }
    out.push('</div>', '</section>');
    return out.join('\n');
  };

  const script = '<script src="app.js"></script>';

  const screen = (s: ScreenPage) =>
    [
      head(`${s.id} ${s.title}`),
      `<body ${c('body')} ${roles(s.roles.map((r) => r.id))}>`,
      frame(s.id, `<main ${c('main')} ${src(s.src)} data-state="normal">`),
      `<p ${c('crumb')}>${esc(s.module.title)} · ${esc(s.id)} · ${esc(s.status)}</p>`,
      `<h1 ${c('title')}>${esc(s.title)}</h1>`,
      ...(s.purpose ? [`<p ${c('purpose')}>${esc(s.purpose)}</p>`] : []),
      `<div ${c('meta')}>`,
      `<div>Roles: <ul>${s.roles
        .map((r) => `<li ${src(r.src)}>${esc(r.title)}${r.scope ? ` (${esc(r.scope)})` : ''}</li>`)
        .join('')}</ul></div>`,
      ...(s.entryPoints.length
        ? [
            `<div>Reached from: <ul>${s.entryPoints
              .map(
                (e) =>
                  `<li ${src(e.src)}>${e.screen && pages.has(e.screen) ? `<a href="${pageFile(e.screen)}">${esc(e.text)}</a>` : esc(e.text)}</li>`,
              )
              .join('')}</ul></div>`,
          ]
        : []),
      '</div>',
      ...s.gaps.map((g) => `<p ${c('gap')} ${src(g.src)}>${esc(g.text)}</p>`),
      `<div ${c('bar')} role="group" aria-label="Business state">`,
      `Show: <button type="button" ${c('state-button')} data-state-set="normal" aria-pressed="true">Normal</button>`,
      ...s.states.map(
        (st) =>
          `<button type="button" ${c('state-button')} data-state-set="${st.key}" aria-pressed="false">${esc(st.label)}</button>`,
      ),
      '</div>',
      ...(s.actions.length
        ? [
            `<div ${c('bar', 'actions')}>`,
            ...s.actions.map(
              (a) =>
                `<button type="button" ${c('action')} ${src(a.src)} ${roles(a.roles)} data-action="${esc(a.id)}"` +
                ` data-action-label="${esc(`${a.id} ${a.label}`)}"` +
                ` data-action-capability="${esc(`Performs ${a.capability}${a.capabilityTitle ? ` ${a.capabilityTitle}` : ''}`)}"` +
                (a.summary ? ` data-action-summary="${esc(a.summary)}"` : '') +
                `>${esc(a.label)}</button>`,
            ),
            '</div>',
          ]
        : []),
      ...s.states.map(
        (st) =>
          `<div ${c('state')} ${src(st.src)} data-for="${st.key}"><strong>${esc(st.label)}</strong>` +
          (st.text ? `<p>${esc(st.text)}</p>` : `<p ${c('gap')}>Not specified</p>`) +
          '</div>',
      ),
      ...s.groups.map(group),
      ...close,
      `<dialog id="as-dialog" ${c('dialog')}><form method="dialog">`,
      '<h2 data-slot="title"></h2><p data-slot="capability"></p><p data-slot="summary"></p>',
      `<button ${c('button')}>Close</button>`,
      '</form></dialog>',
      script,
      '</body>',
      '</html>',
      '',
    ].join('\n');

  const index = () =>
    [
      head('Overview'),
      `<body ${c('body')}>`,
      frame(undefined, `<main ${c('main')} data-state="normal">`),
      `<h1 ${c('title')}>${esc(appName)}</h1>`,
      `<p ${c('purpose')}>A clickable wireframe generated from the product spec. All data is made up. Pick a role at the top`,
      'to see what that role sees; use the state buttons on a screen to see its empty, no-permission and error states.',
      'Highlighted notes mark what the spec does not say yet.</p>',
      ...m.modules.flatMap((mod) => [
        `<h2 ${c('section-title')}>${esc(mod.title)}</h2>`,
        `<ul ${c('index')}>`,
        ...mod.screens.map((ref) => {
          const s = m.screens.find((x) => x.id === ref.id)!;
          const gaps = s.gaps.length ? ` <span ${c('gap')}>${s.gaps.length} open</span>` : '';
          return `<li><a href="${pageFile(s.id)}">${esc(s.id)} ${esc(s.title)}</a> · ${esc(s.status)}${gaps}</li>`;
        }),
        '</ul>',
      ]),
      ...close,
      script,
      '</body>',
      '</html>',
      '',
    ].join('\n');

  const out = new Map<string, string>([['index.html', index()]]);
  for (const s of m.screens) out.set(pageFile(s.id), screen(s));
  return out;
}

const unique = (g: FieldGroup, name: string) => [
  ...new Set(g.records.map((r) => r.values[name] ?? '').filter(Boolean)),
];
