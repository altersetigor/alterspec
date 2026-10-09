import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runValidate } from '../../src/commands/validate.js';
import { runViews } from '../../src/commands/views.js';
import { computeImpact } from '../../src/changes/impact.js';
import {
  WIREFRAME_DIR,
  buildManifest,
  collectElements,
  planWireframe,
  type WireframeManifest,
} from '../../src/wireframe/index.js';
import { buildWireframe } from '../../src/wireframe/model.js';
import { mockRecords } from '../../src/wireframe/mock.js';
import { copyExample } from '../example.js';
import { copyFixture, loadFixture, replace } from '../fixture.js';

const page = (id: string, edits = {}) =>
  planWireframe(loadFixture(edits).model).get(`${WIREFRAME_DIR}/${id}.html`)!;

describe('generic wireframe', () => {
  it('renders every element the manifest expects, and nothing else', () => {
    const { model } = loadFixture();
    const files = planWireframe(model);
    const manifest = JSON.parse(files.get(`${WIREFRAME_DIR}/manifest.json`)!) as WireframeManifest;
    expect(Object.keys(manifest.screens)).toEqual(['SCR-GLB-01', 'SCR-HR-01', 'SCR-PAY-01']);
    for (const [id, s] of Object.entries(manifest.screens)) {
      expect(collectElements(files.get(`${WIREFRAME_DIR}/${s.file}`)!), id).toEqual(s.elements);
    }
  });

  it('tags fields, actions, roles and states with their spec IDs', () => {
    const html = page('SCR-HR-01');
    expect(html).toContain('data-src="SCR-HR-01.ENT-EMPLOYEE.Contract type"');
    expect(html).toContain('<option selected>Permanent</option><option>Fixed term</option>');
    expect(html).toMatch(/data-src="SCR-HR-01.A02" data-roles="ROLE-HR-MANAGER" data-action="A02"/);
    expect(html).toContain('data-src="SCR-HR-01.role.ROLE-HR-MANAGER"');
    expect(html).toContain('data-src="SCR-HR-01.state.empty"');
  });

  it('shows list data with lifecycle states and resolved references', () => {
    const html = page('SCR-PAY-01');
    expect(html).toContain('<th data-src="SCR-PAY-01.ENT-PAYSLIP.Employee">Employee</th>');
    expect(html).toContain('<td>Emma Clarke</td>');
    expect(html).toContain('<th>State</th>');
    expect(html).toContain('<td>issued</td>');
  });

  it('marks what the spec does not say as gaps', () => {
    const html = page('SCR-GLB-01');
    expect(html).toContain('data-src="SCR-GLB-01.gap.state.no-permission"');
    expect(page('SCR-GLB-01', {}).includes('SCR-GLB-01.gap.fields')).toBe(false);
    const missing = page('SCR-GLB-01', {
      'modules/glb/screens/SCR-GLB-01.md': replace(
        'fields:\n  - entity: ENT-PAYSLIP\n    attributes: [Period, Net amount]\n    mode: list\n',
        '',
      ),
    });
    expect(missing).toContain('data-src="SCR-GLB-01.gap.fields"');
  });

  it('is deterministic', () => {
    const a = buildManifest(buildWireframe(loadFixture().model));
    const b = buildManifest(buildWireframe(loadFixture().model));
    expect(a).toEqual(b);
    const { model } = loadFixture();
    const e = model.entities.get('ENT-EMPLOYEE')!.data;
    expect(mockRecords(e, () => [])).toEqual(mockRecords(e, () => []));
    expect(mockRecords(e, () => []).map((r) => r.state)).toEqual([
      'draft',
      'active',
      'left',
      'draft',
      'active',
    ]);
  });

  it('removes the page of a deleted screen', () => {
    const dir = copyFixture();
    const glb = join(dir, 'spec/modules/glb/screens/SCR-GLB-01.md');
    const cap = join(dir, 'spec/modules/glb/capabilities/CAP-GLB-001.md');
    writeFileSync(cap, readFileSync(cap, 'utf8').replace('screens: [SCR-GLB-01]', 'screens: []'));
    const page = join(dir, 'spec', WIREFRAME_DIR, 'SCR-GLB-01.html');
    expect(existsSync(page)).toBe(true);
    rmSync(glb);
    expect(
      runValidate(dir).findings.some((f) => f.rule === 'views-stale' && f.file.endsWith('SCR-GLB-01.html')),
    ).toBe(true);
    expect(runViews(dir).changed).toContain(`${WIREFRAME_DIR}/SCR-GLB-01.html`);
    expect(existsSync(page)).toBe(false);
    expect(runViews(dir).changed).toEqual([]);
  });

  it('removes the folder a version before 0.6 wrote (_generated/prototype/)', () => {
    const dir = copyFixture();
    const legacy = join(dir, 'spec/_generated/prototype/index.html');
    mkdirSync(join(dir, 'spec/_generated/prototype'), { recursive: true });
    writeFileSync(legacy, '<!doctype html>\n');
    expect(runValidate(dir).findings.map((f) => f.rule)).toEqual(['views-stale']);
    expect(runViews(dir).changed).toEqual(['_generated/prototype/index.html']);
    expect(existsSync(legacy)).toBe(false);
    expect(existsSync(join(dir, 'spec/_generated/prototype'))).toBe(false);
    expect(runValidate(dir).findings).toEqual([]);
  });

  it('impact lists only wireframe pages whose content changes', () => {
    const dir = copyExample();
    const pages = () =>
      computeImpact(dir, 'CHG-002')
        .views.map((v) => v.file)
        .filter((f) => f.startsWith(WIREFRAME_DIR));
    // CHG-002 adds an attribute no screen shows: no page changes.
    expect(pages()).toEqual([]);
    const cap = join(dir, 'spec/changes/CHG-002/spec/modules/cat/capabilities/CAP-CAT-006.md');
    writeFileSync(
      cap,
      readFileSync(cap, 'utf8').replace(
        'so that it is no longer sold',
        'so that it is no longer sold or bought',
      ),
    );
    expect(pages()).toEqual([`${WIREFRAME_DIR}/SCR-CAT-01.html`]);
  });
});
