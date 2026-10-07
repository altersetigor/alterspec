import type { Design } from '../../schemas/design.js';
import type { Skin } from '../render.js';
import { CDN, script } from './cdn.js';

const LIGHT = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  card: '#ffffff',
  muted: '#f4f4f5',
  'muted-foreground': '#71717a',
  border: '#e4e4e7',
  input: '#e4e4e7',
};
const DARK = {
  background: '#0a0a0a',
  foreground: '#fafafa',
  card: '#18181b',
  muted: '#27272a',
  'muted-foreground': '#a1a1aa',
  border: '#27272a',
  input: '#3f3f46',
};

/** Tailwind with shadcn/ui-style tokens (background, foreground, muted, border, primary…). */
export function tailwindSkin(design: Design, extraHead: string[]): Skin {
  const t = design.theme;
  const base = t.dark ? DARK : LIGHT;
  const theme = [
    '<style type="text/tailwindcss">',
    '@theme {',
    ...Object.entries(base).map(([k, v]) => `  --color-${k}: ${v};`),
    `  --color-primary: ${t.primary ?? (t.dark ? '#fafafa' : '#18181b')};`,
    `  --color-primary-foreground: ${t.primary ? '#ffffff' : t.dark ? '#18181b' : '#fafafa'};`,
    `  --color-destructive: ${t.danger ?? '#dc2626'};`,
    `  --color-warning: ${t.warning ?? '#b45309'};`,
    ...(t.font ? [`  --font-sans: ${t.font};`] : []),
    ...(t.radius
      ? [`  --radius-md: ${t.radius};`, `  --radius-lg: ${t.radius};`, `  --radius-xl: ${t.radius};`]
      : []),
    '}',
    '</style>',
  ];
  const sidebar = design.shell === 'sidebar';
  const control = 'h-9 rounded-md border border-input bg-background px-3 text-sm';
  return {
    ...(t.dark ? { html: 'class="dark"' } : {}),
    head: [script(CDN.tailwind), ...theme, ...extraHead],
    shell: design.shell,
    cls: {
      body: 'bg-background text-foreground font-sans antialiased',
      top: 'flex items-center justify-between gap-4 border-b border-border px-6 h-14',
      app: 'flex items-center gap-2 font-semibold',
      logo: 'h-7',
      badge: 'rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground',
      role: 'flex items-center gap-2 text-sm',
      'role-select': control,
      layout: sidebar ? 'grid grid-cols-[240px_1fr] min-h-[calc(100vh-3.5rem)]' : '',
      nav: sidebar
        ? 'border-r border-border p-4 text-sm'
        : 'flex flex-wrap items-center gap-6 border-b border-border px-6 py-2 text-sm',
      'nav-heading': `text-xs font-medium uppercase tracking-wide text-muted-foreground ${sidebar ? 'mt-4 mb-1' : ''}`,
      'nav-list': sidebar ? 'space-y-0.5' : 'flex gap-2',
      'nav-link': 'block rounded-md px-2 py-1 hover:bg-muted',
      'nav-link-active': 'block rounded-md px-2 py-1 bg-muted font-medium',
      main: 'p-8 max-w-5xl',
      crumb: 'text-sm text-muted-foreground',
      title: 'mt-1 mb-2 text-2xl font-semibold tracking-tight',
      purpose: 'text-muted-foreground',
      meta: 'mt-2 flex flex-wrap gap-6 text-sm text-muted-foreground [&_ul]:inline [&_li]:mr-2 [&_li]:inline',
      gap: 'my-1 rounded-md border border-dashed border-warning px-3 py-1 text-sm text-warning',
      bar: 'my-4 flex flex-wrap items-center gap-2 text-sm',
      'state-button':
        'h-8 rounded-md border border-input px-3 text-sm hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground',
      action:
        'h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90',
      state: 'my-4 rounded-lg border border-border bg-muted p-4 text-sm',
      group: 'my-4 rounded-xl border border-border bg-card p-6 shadow-sm',
      'group-title': 'mb-3 text-base font-semibold',
      mode: 'ml-2 text-xs font-normal text-muted-foreground',
      table:
        'w-full text-sm [&_td]:border-b [&_td]:border-border [&_td]:py-2 [&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-muted-foreground',
      dl: 'grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm [&_div]:contents [&_dt]:text-muted-foreground',
      field: 'mb-4 grid max-w-md gap-1.5',
      label: 'text-sm font-medium',
      input: control,
      select: control,
      check: 'h-4 w-4',
      req: 'text-destructive',
      dialog:
        'm-auto rounded-xl border border-border bg-background p-6 text-foreground shadow-lg backdrop:bg-black/40',
      button: 'h-9 rounded-md border border-input px-4 text-sm',
      index: 'space-y-1 text-sm [&_a]:underline',
      'section-title': 'mt-6 mb-2 text-lg font-semibold',
    },
  };
}
