import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runValidate } from '../src/commands/validate.js';
import { runViews } from '../src/commands/views.js';
import { blockHash, findBlocks, isEdited, renderBlock, replaceBlocks } from '../src/views/blocks.js';
import { changedFiles, planViews } from '../src/views/plan.js';
import { copyFixture, loadFixture, replace } from './fixture.js';

describe('generated blocks', () => {
  it('round-trips content and hash', () => {
    const text = `a\n${renderBlock('x', '| t |')}\nb`;
    const [b] = findBlocks(text);
    expect(b).toMatchObject({ name: 'x', content: '| t |', hash: blockHash('| t |'), line: 2 });
    expect(isEdited(b!)).toBe(false);
    expect(isEdited(findBlocks(text.replace('| t |', '| u |'))[0]!)).toBe(true);
  });

  it('treats empty template blocks as never generated', () => {
    const [b] = findBlocks('<!-- GENERATED:start x -->\n<!-- GENERATED:end -->');
    expect(b).toMatchObject({ hash: undefined, content: '' });
    expect(isEdited(b!)).toBe(false);
  });

  it('replaces only named blocks and reports missing ones', () => {
    const src =
      '<!-- GENERATED:start a -->\n<!-- GENERATED:end -->\ntext\n<!-- GENERATED:start keep -->\nold\n<!-- GENERATED:end -->';
    const { text, missing } = replaceBlocks(src, { a: 'new', b: 'x' });
    expect(text).toContain(renderBlock('a', 'new'));
    expect(text).toContain('old');
    expect(missing).toEqual(['b']);
  });
});

describe('views', () => {
  it('the committed fixture is up to date (rendering is deterministic)', () => {
    const { model } = loadFixture();
    expect(changedFiles(model, planViews(model))).toEqual([]);
  });

  it('renders cross-module links, entity gaps and the role matrix', () => {
    const { model } = loadFixture({
      'modules/hr/capabilities/CAP-HR-003.md': replace('ops: [R, U, A]', 'ops: [R, U]'),
    });
    const plan = planViews(model);
    const entity = plan.blocks.get('application/entities/ENT-EMPLOYEE.md')!['entity-coverage']!;
    expect(entity).toContain('[CAP-PAY-001](../../modules/pay/capabilities/CAP-PAY-001.md)');
    expect(entity).toContain('No capability performs: A or D');
    const matrix = plan.files.get('_generated/role-matrix.md')!;
    expect(matrix).toContain('| Capability | ROLE-ACCOUNTANT | ROLE-EMPLOYEE | ROLE-HR-MANAGER |');
    expect(matrix).toContain('| [CAP-GLB-001](../modules/glb/capabilities/CAP-GLB-001.md) | — | own | — |');
  });

  it('writes changes, then a second run writes nothing; lint is clean afterwards', () => {
    const dir = copyFixture();
    const cap = join(dir, 'spec/modules/hr/capabilities/CAP-HR-001.md');
    writeFileSync(
      cap,
      readFileSync(cap, 'utf8').replace('title: Register employee', 'title: Register new employee'),
    );
    expect(runValidate(dir).findings.map((f) => f.rule)).toContain('views-stale');

    expect(runViews(dir, { check: true }).changed).toContain('modules/hr/module.md');
    expect(readFileSync(join(dir, 'spec/modules/hr/module.md'), 'utf8')).not.toContain(
      'Register new employee',
    );

    const first = runViews(dir);
    expect(first.changed).toEqual(
      expect.arrayContaining([
        'modules/hr/module.md',
        'modules/hr/screens/SCR-HR-01.md',
        '_generated/traceability.md',
      ]),
    );
    expect(readFileSync(join(dir, 'spec/modules/hr/module.md'), 'utf8')).toContain('Register new employee');
    expect(runViews(dir).changed).toEqual([]);
    expect(runValidate(dir).findings).toEqual([]);
  });

  it('a hand-edited block is reported, and views restores it', () => {
    const dir = copyFixture();
    const mod = join(dir, 'spec/modules/pay/module.md');
    writeFileSync(
      mod,
      readFileSync(mod, 'utf8').replace('| Issue payslip | draft |', '| Issue payslip | approved |'),
    );
    expect(runValidate(dir).findings.map((f) => f.rule)).toEqual(['generated-edited']);
    runViews(dir);
    expect(runValidate(dir).findings).toEqual([]);
  });

  it('skips files with invalid front-matter', () => {
    const dir = copyFixture();
    const ent = join(dir, 'spec/application/entities/ENT-PAYSLIP.md');
    writeFileSync(ent, readFileSync(ent, 'utf8').replace('status: draft', 'status: nope'));
    expect(runViews(dir).skipped).toEqual(['application/entities/ENT-PAYSLIP.md']);
  });

  it('validate --report writes a lint report', () => {
    const dir = copyFixture();
    runValidate(dir, { report: true });
    expect(readFileSync(join(dir, 'spec/_generated/lint-report.md'), 'utf8')).toContain('_No findings._');
  });
});
