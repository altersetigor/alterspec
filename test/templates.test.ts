import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASSETS_DIR } from '../src/assets.js';
import { stripItems } from '../src/install/skeleton.js';
import { parseCollection } from '../src/lib/collection.js';
import { parseFrontMatter } from '../src/lib/frontmatter.js';
import { renderTemplate } from '../src/lib/template.js';
import { PROSE_TEMPLATES, SPEC_TYPES, itemSchemaFor } from '../src/schemas/index.js';
import { issues, readAsset } from './helpers.js';

const VARS: Record<string, string> = {
  app_name: 'Demo',
  MOD: 'HR',
  NNN: '001',
  NN: '01',
  title: 'Sample title',
  role: 'HR-MANAGER',
  role_title: 'HR manager',
  persona: 'HR-LEAD',
  persona_title: 'HR lead',
  entity: 'EMPLOYEE',
  event: 'EMPLOYEE-HIRED',
  term: 'Employee',
  date: '2026-10-06',
  op: 'added',
  target: 'CAP-HR-001',
  party: 'Tax office',
};

const render = (name: string) => renderTemplate(readAsset(`templates/${name}`), VARS);

describe('templates', () => {
  const files = readdirSync(join(ASSETS_DIR, 'templates'));
  const registered = new Set<string>([
    ...Object.values(SPEC_TYPES).map((t) => t.template),
    ...PROSE_TEMPLATES,
  ]);

  it('every template file is registered, and every registered template exists', () => {
    expect(new Set(files)).toEqual(registered);
  });

  it('every placeholder is covered by the test variables', () => {
    for (const f of files) expect(render(f), f).not.toMatch(/\{\{/);
  });

  for (const [type, def] of Object.entries(SPEC_TYPES)) {
    it(`${def.template} passes the ${type} schema`, () => {
      const { data, body, hasFrontMatter } = parseFrontMatter(render(def.template));
      if (def.kind === 'document') {
        expect(hasFrontMatter).toBe(true);
        expect(issues(def.schema.safeParse(data))).toEqual([]);
        return;
      }
      const items = parseCollection(body);
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        const schema = itemSchemaFor(def, item.heading);
        if (!schema) throw new Error(`no item schema for "${item.heading}"`);
        expect(issues(schema.safeParse(item.data)), item.heading).toEqual([]);
        const id = (item.data as { id?: string }).id;
        if (id) expect(item.heading.startsWith(`${id} `), `heading must start with ${id}`).toBe(true);
      }
    });
  }

  it('generated blocks in templates are empty placeholders', () => {
    for (const f of files) {
      for (const m of readAsset(`templates/${f}`).matchAll(
        /<!-- GENERATED:start [\w-]+ -->([\s\S]*?)<!-- GENERATED:end -->/g,
      )) {
        expect(m[1]?.trim(), f).toBe('');
      }
    }
  });
});

describe('stripItems', () => {
  it('drops example items and keeps top-level headings', () => {
    const out = stripItems(readAsset('templates/personas-roles.md'));
    expect(out).toContain('# Personas');
    expect(out).toContain('# Roles');
    expect(parseCollection(out)).toEqual([]);
    expect(out).not.toContain('{{');
  });
});
