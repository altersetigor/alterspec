import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runPrototypeBuild, runPrototypeCheck, runPrototypeInit } from '../../src/commands/prototype.js';
import { readDesign } from '../../src/prototype/variant.js';
import { collectElements } from '../../src/prototype/index.js';
import { EXAMPLE, copyExample } from '../example.js';
import { copyFixture } from '../fixture.js';

const tree = (dir: string, files: string[]) =>
  new Map(files.map((f) => [f, readFileSync(join(dir, f), 'utf8')]));

describe('design', () => {
  it('init writes a starter design once and never overwrites', () => {
    const dir = copyFixture();
    expect(runPrototypeInit(dir, { base: 'tabler' }).created).toEqual([
      'design/design.yaml',
      'design/tokens.css',
    ]);
    expect(readDesign(dir)).toMatchObject({ base: 'tabler', shell: 'sidebar', theme: { dark: false } });
    expect(runPrototypeInit(dir).skipped).toEqual(['design/design.yaml', 'design/tokens.css']);
    expect(() => runPrototypeInit(copyFixture(), { base: 'material' })).toThrow(/unknown base/);
  });

  it('rejects an invalid design', () => {
    const dir = copyFixture();
    runPrototypeInit(dir);
    writeFileSync(join(dir, 'design/design.yaml'), 'base: bootstrap\ntheme:\n  primary: purple\n');
    expect(() => readDesign(dir)).toThrow(/theme.primary: must be a colour/);
  });
});

describe('variants', () => {
  it('build every variant with the same elements as the generic prototype', () => {
    const dir = copyFixture();
    runPrototypeInit(dir);
    for (const variant of ['bootstrap', 'tabler', 'tailwind']) {
      const r = runPrototypeBuild(dir, { variant });
      expect(r.files).toContain('SCR-HR-01.html');
      const generic = readFileSync(join(dir, 'spec/_generated/prototype/SCR-HR-01.html'), 'utf8');
      const page = readFileSync(join(dir, r.folder, 'SCR-HR-01.html'), 'utf8');
      expect(collectElements(page)).toEqual(collectElements(generic));
    }
    expect(runPrototypeCheck(dir).findings).toEqual([]);
  });

  it('applies the theme and the tokens', () => {
    const dir = copyFixture();
    runPrototypeInit(dir);
    writeFileSync(
      join(dir, 'design/design.yaml'),
      'base: bootstrap\napp:\n  name: Payroll\nshell: topbar\ntheme:\n  primary: "#7c3aed"\n  dark: true\n',
    );
    const r = runPrototypeBuild(dir);
    const page = readFileSync(join(dir, r.folder, 'SCR-HR-01.html'), 'utf8');
    expect(page).toContain('<html lang="en" data-bs-theme="dark">');
    expect(page).toMatch(/integrity="sha384-[A-Za-z0-9+/=]+" crossorigin="anonymous"/);
    expect(page).toContain('<link rel="stylesheet" href="tokens.css">');
    expect(page).toContain('Payroll</a>');
    expect(readFileSync(join(dir, r.folder, 'theme.css'), 'utf8')).toContain(
      '--bs-primary-rgb: 124, 58, 237;',
    );
    const tw = runPrototypeBuild(dir, { variant: 'tailwind' });
    expect(readFileSync(join(dir, tw.folder, 'index.html'), 'utf8')).toContain('--color-primary: #7c3aed;');
  });

  it('refuses custom builds and unknown variants', () => {
    const dir = copyFixture();
    runPrototypeInit(dir, { base: 'custom' });
    expect(() => runPrototypeBuild(dir)).toThrow(/written with Claude/);
    expect(() => runPrototypeBuild(dir, { variant: 'material' })).toThrow(/unknown variant/);
    expect(() => runPrototypeBuild(copyFixture())).toThrow(/no design\/design.yaml/);
  });
});

describe('prototype check', () => {
  const built = () => {
    const dir = copyFixture();
    runPrototypeInit(dir);
    runPrototypeBuild(dir);
    return dir;
  };
  const kinds = (dir: string) => runPrototypeCheck(dir).findings.map((f) => `${f.kind} ${f.message}`);

  it('reports a removed element and an invented one', () => {
    const dir = built();
    const p = join(dir, 'prototype/bootstrap/SCR-HR-01.html');
    writeFileSync(
      p,
      readFileSync(p, 'utf8')
        .replace('data-src="SCR-HR-01.A02" ', '')
        .replace('</main>', '<button data-src="SCR-HR-01.A09">Delete</button></main>'),
    );
    expect(kinds(dir)).toEqual([
      'missing-element missing SCR-HR-01.A02',
      'extra-element SCR-HR-01.A09 is not in the spec',
    ]);
  });

  it('reports missing and extra pages', () => {
    const dir = built();
    const v = join(dir, 'prototype/bootstrap');
    cpSync(join(v, 'SCR-HR-01.html'), join(v, 'SCR-HR-09.html'));
    rmSync(join(v, 'SCR-PAY-01.html'));
    expect(kinds(dir)).toEqual([
      'missing-page no page for SCR-PAY-01',
      'extra-page SCR-HR-09.html is not a screen in the spec',
    ]);
  });

  it('reports a variant built from an older spec, and a custom variant until it is stamped', () => {
    const dir = built();
    const cap = join(dir, 'spec/modules/hr/capabilities/CAP-HR-002.md');
    writeFileSync(
      cap,
      readFileSync(cap, 'utf8').replace('title: Activate employee', 'title: Activate new employee'),
    );
    expect(kinds(dir)).toEqual([
      'stale built from an older spec; build it again (or update it and re-stamp)',
    ]);
    runPrototypeBuild(dir);
    expect(kinds(dir)).toEqual([]);

    cpSync(join(dir, 'prototype/bootstrap'), join(dir, 'prototype/custom'), { recursive: true });
    rmSync(join(dir, 'prototype/custom/variant.json'));
    expect(kinds(dir)).toEqual([expect.stringMatching(/^unstamped/)]);
    const r = runPrototypeCheck(dir, { variant: 'custom', stamp: true });
    expect(r).toMatchObject({ stamped: ['custom'], findings: [] });
    expect(JSON.parse(readFileSync(join(dir, 'prototype/custom/variant.json'), 'utf8'))).toMatchObject({
      variant: 'custom',
    });
  });

  it('does not stamp a variant with missing elements', () => {
    const dir = built();
    const p = join(dir, 'prototype/bootstrap/SCR-HR-01.html');
    writeFileSync(p, readFileSync(p, 'utf8').replace('data-src="SCR-HR-01.A02" ', ''));
    expect(runPrototypeCheck(dir, { stamp: true })).toMatchObject({ stamped: [] });
  });
});

describe('example', () => {
  it('rebuilding the committed Bootstrap variant reproduces it exactly', () => {
    const dir = copyExample();
    const before = runPrototypeBuild(dir);
    const files = before.files.filter((f) => !f.startsWith('assets/'));
    expect(tree(join(dir, before.folder), files)).toEqual(tree(join(EXAMPLE, before.folder), files));
    expect(runPrototypeCheck(EXAMPLE).findings).toEqual([]);
    expect(existsSync(join(EXAMPLE, 'prototype/bootstrap/index.html'))).toBe(true);
  });
});
