import type { Entity } from '../schemas/entity.js';
import type { SpecModel } from '../spec/model.js';
import { blockHash } from '../views/blocks.js';
import { dryModel } from './index.js';

/**
 * The files that make the mockups an application: spec.js (derived from the spec, always rewritten), config.js
 * (the app's name, logo, icons and demo users — the designer's) and data.js (the seeded demo data — the designer's
 * once written).
 */

/** Badge tone for a lifecycle state, from its name. */
export function stateTone(state: string): string {
  if (/^(active|valid|approved|issued|published|done|completed|paid|open)$/.test(state)) return 'success';
  if (/^(draft|proposed|prospective|new|pending|requested|reserved|submitted)$/.test(state)) return 'info';
  if (/^(blocked|rejected|cancelled|canceled|failed|overdue)$/.test(state)) return 'danger';
  if (/^(expired|archived|discontinued|left|closed|withdrawn|inactive|sold)$/.test(state)) return 'muted';
  return 'neutral';
}

const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

const PEOPLE = [
  'Emma Clarke',
  'James Walker',
  'Olivia Bennett',
  'Liam Turner',
  'Sophie Hughes',
  'Noah Mitchell',
  'Grace Parker',
  'Oliver Reed',
  'Chloe Morgan',
  'Ethan Brooks',
  'Lucy Foster',
  'Jack Harris',
];
const CITIES = [
  'Springfield',
  'Riverside',
  'Fairview',
  'Greenville',
  'Madison',
  'Franklin',
  'Clinton',
  'Georgetown',
];
const SUFFIX = ['Alpha', 'Nova', 'Prime', 'Classic', 'Plus', 'Studio', 'Home', 'Select'];

export const slugOf = (id: string) => id.replace(/^ENT-/, '').toLowerCase();

const IMAGE = /photo|image|picture|logo|avatar|thumbnail|cover/i;
export const isImage = (a: Entity['attributes'][number]) => IMAGE.test(a.name);
const isMultiple = (a: Entity['attributes'][number]) => isImage(a) && /s$/i.test(a.name.trim());

/** Label attribute: a name or title, else the first text attribute. */
export function labelOf(e: Entity): string | undefined {
  const texts = e.attributes.filter((a) => a.kind === 'text');
  return (texts.find((a) => /name|title/i.test(a.name)) ?? texts[0])?.name;
}

export interface SpecJs {
  app: string;
  roles: Record<string, string>;
  modules: { id: string; title: string }[];
  screens: Record<
    string,
    {
      title: string;
      module: string;
      roles: string[];
      top: boolean;
      parents: string[];
      /** Opened for one record picked in a list (not a menu entry). */
      record: boolean;
      scopes: Record<string, string>;
    }
  >;
  entities: Record<
    string,
    {
      title: string;
      prefix: string;
      label?: string;
      initialState?: string;
      states: string[];
      attributes: Record<
        string,
        {
          kind: string;
          required: boolean;
          references?: string;
          options?: string[];
          image?: true;
          multiple?: true;
        }
      >;
    }
  >;
  tones: Record<string, string>;
}

/** A screen that shows one record of what a parent screen lists: reached by picking that record. */
function isRecordScreen(model: SpecModel, id: string, parents: string[]): boolean {
  const pages = dryModel(model).screens;
  const page = pages.find((p) => p.id === id);
  if (!page || page.groups.some((g) => g.mode === 'list')) return false;
  const entities = new Set(page.groups.map((g) => g.entity));
  // A screen that also creates new records is a destination of its own.
  const creates = page.actions.some((a) =>
    model.capabilities
      .get(a.capability)
      ?.data.entities.some((e) => entities.has(e.entity) && e.ops.includes('C')),
  );
  if (creates) return false;
  return parents.some((p) =>
    pages.find((x) => x.id === p)?.groups.some((g) => g.mode === 'list' && entities.has(g.entity)),
  );
}

export function buildSpecJs(model: SpecModel): SpecJs {
  const roles = Object.fromEntries([...model.roles.values()].sort(byId).map((r) => [r.id, r.data.title]));
  const screens = [...model.screens.values()].sort(byId);
  const moduleIds = [...new Set(screens.map((s) => s.data.module))].sort();
  const caps = [...model.capabilities.values()];
  const states = new Set<string>();
  const entities = Object.fromEntries(
    [...model.entities.values()].sort(byId).map((e) => {
      for (const s of e.data.states) states.add(s);
      const label = labelOf(e.data);
      return [
        e.id,
        {
          title: e.data.title,
          prefix: slugOf(e.id),
          ...(label ? { label } : {}),
          ...(e.data.initial_state ? { initialState: e.data.initial_state } : {}),
          states: e.data.states,
          attributes: Object.fromEntries(
            e.data.attributes.map((a) => [
              a.name,
              {
                kind: a.kind,
                required: a.required,
                ...(a.references ? { references: a.references } : {}),
                ...(a.options ? { options: a.options } : {}),
                ...(isImage(a) ? { image: true as const } : {}),
                ...(isMultiple(a) ? { multiple: true as const } : {}),
              },
            ]),
          ),
        },
      ];
    }),
  );
  return {
    app: model.application?.data.title ?? 'Application',
    roles,
    modules: moduleIds.map((id) => ({ id, title: model.modules.get(id)?.data.title ?? id })),
    screens: Object.fromEntries(
      screens.map((s) => {
        const parents = s.data.entry_points.filter((e) => model.screens.has(e));
        const scopes: Record<string, string> = {};
        for (const r of s.data.roles) {
          const fromCap = caps
            .filter((c) => c.data.screens.includes(s.id) || s.data.actions.some((a) => a.capability === c.id))
            .flatMap((c) => c.data.roles.filter((x) => x.role === r.role).map((x) => x.scope));
          const scope = r.scope ?? fromCap[0];
          if (scope) scopes[r.role] = scope;
        }
        return [
          s.id,
          {
            title: s.data.title,
            module: s.data.module,
            roles: s.data.roles.map((r) => r.role),
            top: parents.length === 0,
            parents,
            record: isRecordScreen(model, s.id, parents),
            scopes,
          },
        ];
      }),
    ),
    entities,
    tones: Object.fromEntries([...states].sort().map((s) => [s, stateTone(s)])),
  };
}

const GENERATED =
  '/* global window */\n// Written by `alterspec views` from the spec. Do not edit: it is rewritten.\n';

/** Where `views` writes the spec data the mockups read, relative to spec/. */
export const SPEC_JS = '_generated/experience/spec.js';

export const specJs = (model: SpecModel) =>
  `${GENERATED}window.UX_SPEC = ${JSON.stringify(buildSpecJs(model), null, 2)};\n`;

export interface DemoUser {
  id: string;
  name: string;
  persona?: string;
  role: string;
}

export interface AppConfig {
  name: string;
  logo: string;
  storeKey: string;
  currency: string;
  locale: string;
  /** Image URL template for seeded photos: {w}, {h}, {keywords}, {n}. */
  images: string;
  icons: { modules: Record<string, string>; screens: Record<string, string> };
  /** Optional nav order (screen IDs); empty: every top-level screen, by module. */
  nav: string[];
  users: DemoUser[];
}

const MODULE_ICONS: [RegExp, string][] = [
  [/account|profile|user|member|people|staff/i, 'user'],
  [/deal|order|purchase|buy|sale|checkout/i, 'shopping-cart'],
  [/list|catalog|product|item|article/i, 'tag'],
  [/search|browse|find|discover/i, 'search'],
  [/message|chat|inbox|conversation/i, 'message-square'],
  [/moderat|review|report|trust|safety/i, 'shield-check'],
  [/price|pricing|payment|invoice|billing|finance/i, 'euro'],
  [/supplier|vendor|partner/i, 'truck'],
  [/stock|inventory|warehouse/i, 'package'],
  [/setting|admin|config/i, 'settings'],
  [/shared|global|home|dashboard/i, 'home'],
];

export function defaultConfig(model: SpecModel): AppConfig {
  const spec = buildSpecJs(model);
  const name = spec.app;
  const users: DemoUser[] = [];
  let i = 0;
  const onScreens = new Set(Object.values(spec.screens).flatMap((s) => s.roles));
  for (const p of [...model.personas.values()].sort(byId)) {
    const role = p.data.roles.find((r) => onScreens.has(r));
    if (!role) continue;
    users.push({ id: `u${i + 1}`, name: PEOPLE[i % PEOPLE.length]!, persona: p.data.title, role });
    i++;
  }
  for (const role of Object.keys(spec.roles)) {
    if (!onScreens.has(role) || users.some((u) => u.role === role)) continue;
    users.push({ id: `u${i + 1}`, name: PEOPLE[i % PEOPLE.length]!, role });
    i++;
  }
  return {
    name,
    logo: '',
    storeKey:
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'app',
    currency: '$',
    locale: 'en-US',
    images: 'https://picsum.photos/seed/{keywords}-{n}/{w}/{h}',
    icons: {
      modules: Object.fromEntries(
        spec.modules.map((m) => [m.id, MODULE_ICONS.find(([re]) => re.test(m.title))?.[1] ?? 'folder']),
      ),
      screens: {},
    },
    nav: [],
    users,
  };
}

const CONFIG_HEAD =
  '/* global window */\n// Your application as people will see it: name, logo, icons and the demo accounts on the sign-in page.\n// Edit freely; it must stay valid JSON after `window.UX_APP =`.\n';

export const configJs = (c: AppConfig) => `${CONFIG_HEAD}window.UX_APP = ${JSON.stringify(c, null, 2)};\n`;

/** The config object inside a config.js, or undefined when it can't be read. */
export function parseConfig(text: string): AppConfig | undefined {
  const at = /^window\.UX_APP\s*=\s*/m.exec(text);
  if (!at) return undefined;
  const json = text.slice(at.index + at[0].length, text.lastIndexOf('}') + 1);
  try {
    return JSON.parse(json) as AppConfig;
  } catch {
    return undefined;
  }
}

/** Keep everything the designer set; add demo users for roles nobody can sign in as, and icons for new modules. */
export function mergeConfig(current: AppConfig, model: SpecModel): AppConfig {
  const fresh = defaultConfig(model);
  const users = [...current.users];
  for (const u of fresh.users) {
    if (!users.some((x) => x.role === u.role)) {
      let n = users.length + 1;
      while (users.some((x) => x.id === `u${n}`)) n++;
      users.push({ ...u, id: `u${n}` });
    }
  }
  return {
    ...fresh,
    ...current,
    icons: {
      modules: { ...fresh.icons.modules, ...(current.icons?.modules ?? {}) },
      screens: { ...(current.icons?.screens ?? {}) },
    },
    users,
  };
}

// ---------- seed data ----------

export const RECORDS = 8;
const BASE = Date.UTC(2026, 6, 1);
const DAY = 86_400_000;

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

export interface SeedRecord {
  id: string;
  entity: string;
  state?: string;
  owner?: string;
  values: Record<string, string | number | string[]>;
}

/** Demo records for every entity, linked through reference attributes and owned by the demo users. */
export function seedData(
  model: SpecModel,
  config: AppConfig,
): { version: string; entities: Record<string, SeedRecord[]> } {
  const out: Record<string, SeedRecord[]> = {};
  const entities = [...model.entities.values()].sort(byId);
  const idOf = (entity: string, n: number) => `${slugOf(entity)}-${n}`;
  for (const e of entities) {
    const d = e.data;
    const label = labelOf(d);
    out[e.id] = Array.from({ length: RECORDS }, (_, k) => {
      const n = k + 1;
      const pick = <T>(list: T[]) => list[(n - 1 + (hash(e.id) % list.length)) % list.length]!;
      const values: SeedRecord['values'] = {};
      for (const a of d.attributes) {
        const h = hash(`${e.id}|${a.name}|${n}`);
        const name = a.name.toLowerCase();
        if (isImage(a)) {
          const keys = encodeURIComponent(words(`${d.title}`).join('-'));
          const url = (i: number) =>
            config.images
              .replace('{w}', '800')
              .replace('{h}', '600')
              .replace('{keywords}', keys)
              .replace('{n}', String(n * 10 + i));
          values[a.name] = isMultiple(a) ? [1, 2, 3].map(url) : url(1);
          continue;
        }
        switch (a.kind) {
          case 'reference':
            if (a.references) values[a.name] = idOf(a.references, ((n + (h % 3)) % RECORDS) + 1);
            break;
          case 'amount':
            values[a.name] = Number((5 + (h % 600) - 0.01).toFixed(2));
            break;
          case 'number':
            values[a.name] = 1 + (h % 40);
            break;
          case 'date':
            values[a.name] = new Date(BASE - (n * 4 + (h % 9)) * DAY).toISOString().slice(0, 10);
            break;
          case 'period':
            values[a.name] = `2026-${String(((n + 5) % 12) + 1).padStart(2, '0')}`;
            break;
          case 'yes_no':
            values[a.name] = n % 3 === 0 ? 'No' : 'Yes';
            break;
          case 'choice':
            values[a.name] = a.options?.length ? a.options[(n - 1) % a.options.length]! : `${a.name} ${n}`;
            break;
          default:
            if (/e-?mail/.test(name))
              values[a.name] = `${words(PEOPLE[(n - 1) % PEOPLE.length]!)[0]}@example.com`;
            else if (/phone|mobile/.test(name))
              values[a.name] = `+1 555 01${String((n * 7 + (h % 7)) % 100).padStart(2, '0')}`;
            else if (
              /(full |first |last |nick)?name|person|owner|contact/.test(name) &&
              /person|contact|nick|full|first|last/.test(name)
            )
              values[a.name] = PEOPLE[(n - 1) % PEOPLE.length]!;
            else if (/city|location|place|address|town/.test(name)) values[a.name] = pick(CITIES);
            else if (/number|code|reference|sku|id$/.test(name))
              values[a.name] = `${words(d.title)
                .map((w) => w[0]!.toUpperCase())
                .join('')}-${1000 + n}`;
            else if (a.name === label || /name|title/.test(name))
              values[a.name] = `${d.title} ${SUFFIX[(n - 1) % SUFFIX.length]}`;
            else if (/description|note|comment|reason|summary|details|bio/.test(name))
              values[a.name] =
                `Sample ${a.name.toLowerCase()} for ${d.title.toLowerCase()} ${SUFFIX[(n - 1) % SUFFIX.length]}.`;
            else values[a.name] = `${a.name} ${n}`;
        }
      }
      const owner = config.users.length ? config.users[(n - 1) % config.users.length]!.id : undefined;
      return {
        id: idOf(e.id, n),
        entity: e.id,
        ...(d.states.length ? { state: d.states[(n - 1) % d.states.length]! } : {}),
        ...(owner ? { owner } : {}),
        values,
      };
    });
  }
  return { version: blockHash(JSON.stringify(out)), entities: out };
}

const DATA_HEAD =
  '/* global window */\n// Demo data the mockups start from (and return to on "Reset demo data"). Make it realistic: real names,\n// prices, descriptions and image URLs. Keep ids stable; references point to ids. Bump `version` after editing.\n';

export const dataJs = (d: ReturnType<typeof seedData>) =>
  `${DATA_HEAD}window.UX_DATA = ${JSON.stringify(d, null, 2)};\n`;

/** The sign-in page. */
export function loginHtml(appTitle: string): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>Sign in · ${appTitle.replace(/[<&"]/g, '')}</title>`,
    '<link rel="stylesheet" href="kit/tokens.css">',
    '<link rel="stylesheet" href="kit/components.css">',
    '</head>',
    '<body data-login>',
    '<main class="ux-login" data-login></main>',
    ...SCRIPTS,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/** Scripts every mockup page loads, in order. */
export const SCRIPTS = [
  '<script src="config.js"></script>',
  '<script src="../../_generated/experience/spec.js"></script>',
  '<script src="data.js"></script>',
  '<script src="kit/icons.js"></script>',
  '<script src="kit/store.js"></script>',
  '<script src="kit/ui.js"></script>',
  '<script src="kit/app.js"></script>',
];
