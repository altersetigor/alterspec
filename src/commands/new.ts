import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { isSeq, parseDocument } from 'yaml';
import { ASSETS_DIR } from '../assets.js';
import { nextNumber } from '../authoring/ids.js';
import { extractItems } from '../install/skeleton.js';
import { splitFrontMatter } from '../lib/frontmatter.js';
import { renderTemplate } from '../lib/template.js';
import { ID_REGEX, Scope, moduleCode } from '../schemas/index.js';
import { readSpecDir } from '../spec/files.js';
import { loadSpec } from '../spec/load.js';
import type { SpecModel } from '../spec/model.js';
import { runViews } from './views.js';

export const NEW_TYPES = [
  'module',
  'capability',
  'screen',
  'entity',
  'flow',
  'rule',
  'event',
  'persona',
  'role',
  'decision',
  'term',
] as const;
export type NewType = (typeof NEW_TYPES)[number];

export interface NewOptions {
  spec?: string;
  code?: string;
  module?: string;
  title?: string;
  name?: string;
  role?: string;
  scope?: string;
  capability?: string;
  external?: boolean;
  kind?: string;
  term?: string;
  forbidden?: string;
}

export interface NewResult {
  id: string;
  /** Path relative to the project root. */
  file: string;
  line: number;
}

const REQUIRED: Record<NewType, (keyof NewOptions)[]> = {
  module: ['code', 'title'],
  capability: ['module', 'title', 'role'],
  screen: ['module', 'title'],
  entity: ['name', 'title'],
  flow: ['title', 'capability'],
  rule: ['title'],
  event: ['name', 'title'],
  persona: ['name', 'title'],
  role: ['name', 'title'],
  decision: ['title'],
  term: ['term'],
};

const template = (name: string) => readFileSync(join(ASSETS_DIR, 'templates', name), 'utf8');

/** Normalise `HR`, `hr` or `MOD-HR` to the module code `HR`. */
const codeOf = (m: string) => moduleCode(m.trim().toUpperCase());
/** Normalise `HR-MANAGER` or `ROLE-HR-MANAGER` to the full ID. */
const withPrefix = (prefix: string, v: string) => {
  const up = v.trim().toUpperCase().replace(/\s+/g, '-');
  return up.startsWith(`${prefix}-`) ? up : `${prefix}-${up}`;
};
const quote = (s: string) => JSON.stringify(s);

class NewError extends Error {}

export function runNew(dir: string, type: NewType, opts: NewOptions): NewResult {
  if (!NEW_TYPES.includes(type))
    throw new NewError(`unknown type "${type}"; use one of: ${NEW_TYPES.join(', ')}`);
  const missing = REQUIRED[type].filter((k) => opts[k] === undefined || opts[k] === '');
  if (missing.length) {
    throw new NewError(`alterspec new ${type} needs ${missing.map((m) => `--${m}`).join(', ')}`);
  }

  const root = resolve(dir);
  const specDir = opts.spec ?? 'spec';
  const specRoot = join(root, specDir);
  const files = readSpecDir(specRoot);
  const { model } = loadSpec(files);
  const result = create(type, opts, { specRoot, files, model });
  runViews(root, { spec: specDir });
  return { ...result, file: `${specDir}/${result.file}` };
}

interface Ctx {
  specRoot: string;
  files: ReturnType<typeof readSpecDir>;
  model: SpecModel;
}

function writeNew(ctx: Ctx, path: string, content: string) {
  const full = join(ctx.specRoot, path);
  if (existsSync(full)) throw new NewError(`${path} already exists`);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

/** Append an item to a collection file. Returns the 1-based line of the new heading. */
function appendItem(ctx: Ctx, path: string, item: string, createFrom?: string): number {
  const full = join(ctx.specRoot, path);
  let current: string;
  if (existsSync(full)) current = readFileSync(full, 'utf8');
  else if (createFrom !== undefined) current = createFrom;
  else throw new NewError(`${path} doesn't exist; run \`alterspec init\` first`);
  const base = current.trimEnd() + '\n\n';
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, base + item);
  return base.split('\n').length;
}

function itemOf(templateName: string, prefix: string, vars: Record<string, string>): string {
  const item = extractItems(template(templateName)).find((i) => i.startsWith(`## ${prefix}`));
  if (!item) throw new Error(`template ${templateName} has no ${prefix} item`);
  return renderTemplate(item, vars);
}

function requireModule(ctx: Ctx, m: string): string {
  const code = codeOf(m);
  if (!ctx.model.modules.has(`MOD-${code}`)) {
    throw new NewError(
      `module MOD-${code} doesn't exist; create it with \`alterspec new module --code ${code}\``,
    );
  }
  return code;
}

function requireNew(ctx: Ctx, id: string, kind: keyof typeof ID_REGEX) {
  if (!ID_REGEX[kind].test(id)) throw new NewError(`${id} is not a valid ${kind} ID`);
  if (ctx.model.definitions.has(id)) throw new NewError(`${id} already exists`);
}

function create(type: NewType, o: NewOptions, ctx: Ctx): NewResult {
  const title = o.title ?? '';
  switch (type) {
    case 'module': {
      const code = codeOf(o.code!);
      const id = `MOD-${code}`;
      requireNew(ctx, id, 'module');
      const dir = `modules/${code.toLowerCase()}`;
      writeNew(
        ctx,
        `${dir}/module.md`,
        renderTemplate(template('module.md'), { MOD: code, title: quoteless(title) }),
      );
      for (const sub of ['capabilities', 'screens']) writeNew(ctx, `${dir}/${sub}/.gitkeep`, '');
      registerModule(ctx, id);
      return { id, file: `${dir}/module.md`, line: 1 };
    }
    case 'capability': {
      const code = requireModule(ctx, o.module!);
      const role = withPrefix('ROLE', o.role!);
      if (!ctx.model.roles.has(role)) {
        throw new NewError(
          `${role} doesn't exist; create it with \`alterspec new role --name ${role.slice(5)}\``,
        );
      }
      const scope = Scope.safeParse(o.scope ?? 'own');
      if (!scope.success) throw new NewError(`--scope must be one of ${Scope.options.join(', ')}`);
      const nnn = nextNumber(ctx.files, `CAP-${code}-`, 3);
      const id = `CAP-${code}-${nnn}`;
      const file = `modules/${code.toLowerCase()}/capabilities/${id}.md`;
      writeNew(
        ctx,
        file,
        renderTemplate(template('capability.md'), {
          MOD: code,
          NNN: nnn,
          title: quoteless(title),
          role: role.slice(5),
          scope: scope.data,
        }),
      );
      return { id, file, line: 1 };
    }
    case 'screen': {
      const code = codeOf(o.module!);
      if (code !== 'GLB') requireModule(ctx, o.module!);
      else if (!ctx.model.modules.has('MOD-GLB')) {
        throw new NewError(
          "module MOD-GLB doesn't exist; create it with `alterspec new module --code GLB --title Shared`",
        );
      }
      const nn = nextNumber(ctx.files, `SCR-${code}-`, 2);
      const id = `SCR-${code}-${nn}`;
      const file = `modules/${code.toLowerCase()}/screens/${id}.md`;
      writeNew(
        ctx,
        file,
        renderTemplate(template('screen.md'), { MOD: code, NN: nn, title: quoteless(title) }),
      );
      return { id, file, line: 1 };
    }
    case 'entity': {
      const id = withPrefix('ENT', o.name!);
      requireNew(ctx, id, 'entity');
      const file = `application/entities/${id}.md`;
      writeNew(
        ctx,
        file,
        renderTemplate(template('entity.md'), { entity: id.slice(4), title: quoteless(title) }),
      );
      return { id, file, line: 1 };
    }
    case 'flow': {
      const cap = o.capability!.trim().toUpperCase();
      if (!ctx.model.capabilities.has(cap)) throw new NewError(`${cap} doesn't exist`);
      const nnn = nextNumber(ctx.files, 'FLOW-', 3);
      const id = `FLOW-${nnn}`;
      const file = `application/flows/${id}.md`;
      writeNew(
        ctx,
        file,
        renderTemplate(template('flow.md'), { NNN: nnn, title: quoteless(title), capability: cap }),
      );
      linkFlow(ctx, cap, id);
      return { id, file, line: 1 };
    }
    case 'rule': {
      if (o.module) {
        const code = requireModule(ctx, o.module);
        const nnn = nextNumber(ctx.files, `RULE-${code}-`, 3);
        const id = `RULE-${code}-${nnn}`;
        const file = `modules/${code.toLowerCase()}/rules.md`;
        const vars = { MOD: code, NNN: nnn, title: quoteless(title) };
        const skeleton = renderTemplate(
          template('module-rules.md').split('\n## ')[0]!.trimEnd() + '\n',
          vars,
        );
        const line = appendItem(ctx, file, itemOf('module-rules.md', 'RULE-', vars), skeleton);
        return { id, file, line };
      }
      const nnn = nextNumber(ctx.files, 'RULE-', 3);
      const id = `RULE-${nnn}`;
      const line = appendItem(
        ctx,
        'application/rules.md',
        itemOf('rules.md', 'RULE-', { NNN: nnn, title: quoteless(title) }),
      );
      return { id, file: 'application/rules.md', line };
    }
    case 'event': {
      const id = withPrefix('EVT', o.name!);
      requireNew(ctx, id, 'event');
      const vars = { event: id.slice(4), title: quoteless(title), external: String(o.external ?? false) };
      return {
        id,
        file: 'application/events.md',
        line: appendItem(ctx, 'application/events.md', itemOf('events.md', 'EVT-', vars)),
      };
    }
    case 'persona': {
      const id = withPrefix('PER', o.name!);
      requireNew(ctx, id, 'persona');
      const role = o.role ? withPrefix('ROLE', o.role) : undefined;
      if (role && !ctx.model.roles.has(role)) throw new NewError(`${role} doesn't exist`);
      const vars = { persona: id.slice(4), persona_title: quoteless(title), persona_roles: role ?? '' };
      const file = 'application/personas-roles.md';
      return {
        id,
        file,
        line: insertBefore(ctx, file, '# Roles', itemOf('personas-roles.md', 'PER-', vars)),
      };
    }
    case 'role': {
      const id = withPrefix('ROLE', o.name!);
      requireNew(ctx, id, 'role');
      const vars = { role: id.slice(5), role_title: quoteless(title) };
      const file = 'application/personas-roles.md';
      return { id, file, line: appendItem(ctx, file, itemOf('personas-roles.md', 'ROLE-', vars)) };
    }
    case 'decision': {
      const kind = o.kind ?? 'open_question';
      if (!['decision', 'open_question', 'assumption'].includes(kind)) {
        throw new NewError('--kind must be decision, open_question or assumption');
      }
      const nnn = nextNumber(ctx.files, 'DEC-', 3);
      const id = `DEC-${nnn}`;
      const vars = { NNN: nnn, title: quoteless(title), kind };
      return {
        id,
        file: 'application/decisions.md',
        line: appendItem(ctx, 'application/decisions.md', itemOf('decisions.md', 'DEC-', vars)),
      };
    }
    case 'term': {
      const term = oneLine(o.term!);
      if (ctx.model.glossary.some((g) => g.data.term.toLowerCase() === term.toLowerCase())) {
        throw new NewError(`"${term}" is already in the glossary`);
      }
      const forbidden = (o.forbidden ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map(quote)
        .join(', ');
      const item = itemOf('glossary.md', '', { term: quoteless(term), forbidden });
      return {
        id: term,
        file: 'application/glossary.md',
        line: appendItem(ctx, 'application/glossary.md', item),
      };
    }
  }
}

/** Titles go into quoted YAML (`title: "{{title}}"`) and a markdown heading: keep them on one line, escape quotes. */
const quoteless = (t: string) => oneLine(t).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const oneLine = (t: string) => t.replace(/\s+/g, ' ').trim();

/** Insert an item before a top-level heading (e.g. personas go above `# Roles`), or append. */
function insertBefore(ctx: Ctx, path: string, heading: string, item: string): number {
  const full = join(ctx.specRoot, path);
  const current = readFileSync(full, 'utf8');
  const lines = current.split('\n');
  const at = lines.findIndex((l) => l.trim() === heading);
  if (at === -1) return appendItem(ctx, path, item);
  const before = lines.slice(0, at).join('\n').trimEnd() + '\n\n';
  writeFileSync(full, before + item + '\n' + lines.slice(at).join('\n'));
  return before.split('\n').length;
}

/** Edit a list in a file's front-matter, keeping comments and layout. */
function editFrontMatterList(full: string, key: string, add: string) {
  const src = readFileSync(full, 'utf8');
  const split = splitFrontMatter(src);
  if (split.raw === undefined) throw new Error(`${full} has no front-matter`);
  const doc = parseDocument(split.raw);
  const list = doc.get(key, true);
  if (isSeq(list)) {
    if (list.items.some((i) => (i as { value?: unknown }).value === add || i === add)) return;
    list.flow = false;
  }
  doc.addIn([key], add);
  writeFileSync(full, `---\n${doc.toString().trimEnd()}\n---\n${split.body}`);
}

function registerModule(ctx: Ctx, id: string) {
  const app = join(ctx.specRoot, 'application/application.md');
  if (!existsSync(app))
    throw new NewError('application/application.md is missing; run `alterspec init` first');
  editFrontMatterList(app, 'modules', id);
}

/** A new flow's first step uses a capability: list the flow in that capability too. */
function linkFlow(ctx: Ctx, cap: string, flow: string) {
  const c = ctx.model.capabilities.get(cap);
  if (c) editFrontMatterList(join(ctx.specRoot, c.file), 'flows', flow);
}

export { NewError };
