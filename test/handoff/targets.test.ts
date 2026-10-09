import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runHandoff } from '../../src/commands/handoff.js';
import { buildBundle } from '../../src/handoff/bundle.js';
import { readSpecDir } from '../../src/spec/files.js';
import { loadSpec } from '../../src/spec/load.js';
import { EXAMPLE, copyExample } from '../example.js';
import { copyFixture } from '../fixture.js';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) =>
    statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)],
  );
const tree = (dir: string) =>
  Object.fromEntries(walk(dir).map((f) => [relative(dir, f), readFileSync(f, 'utf8')]));

describe('handoff golden files', () => {
  it('reproduces the committed example handoff exactly', () => {
    const dir = copyExample();
    runHandoff(dir, 'CAP-PRC-001', { date: '2026-10-07' });
    runHandoff(dir, 'MOD-PRC', { date: '2026-10-07' });
    expect(tree(join(dir, 'handoff'))).toEqual(tree(join(EXAMPLE, 'handoff')));
  });
});

describe('bundle', () => {
  const files = readSpecDir(join(EXAMPLE, 'spec'));
  const { model } = loadSpec(files);

  it('contains everything the capability references, and nothing outside its scope', () => {
    const b = buildBundle(model, files, 'CAP-PRC-001');
    expect(b.scope).toEqual({ id: 'CAP-PRC-001', kind: 'capability', title: 'Propose sales price' });
    expect(b.roles.map((r) => r.id)).toEqual(['ROLE-PRICING-MANAGER']);
    expect(b.personas.map((p) => p.id)).toEqual(['PER-PRICING-ANALYST']);
    expect(b.entities.map((e) => e.id)).toEqual(['ENT-ARTICLE', 'ENT-PURCHASE-PRICE', 'ENT-SALES-PRICE']);
    expect(b.rules.map((r) => r.id)).toEqual(['RULE-001', 'RULE-PRC-001']);
    expect(b.events.map((e) => e.id)).toEqual(['EVT-ARTICLE-ACTIVATED', 'EVT-PURCHASE-PRICE-CHANGED']);
    expect(b.screens.map((s) => s.id)).toEqual(['SCR-PRC-01']);
    expect(b.flows.map((f) => f.id)).toEqual(['FLOW-001', 'FLOW-002']);
    expect(b.openQuestions.map((q) => q.id)).toEqual(['DEC-001']);
    expect(b.glossary.map((g) => g.term)).toEqual(
      expect.arrayContaining(['Article', 'Purchase price', 'Sales price']),
    );
    expect(b.glossary.map((g) => g.term)).not.toContain('Supplier');
    const ids = new Set(b.sources.map((s) => s.id));
    for (const x of ['CAP-PRC-001', 'MOD-PRC', 'RULE-PRC-001', 'ENT-SALES-PRICE', 'term:Sales price'])
      expect(ids.has(x), x).toBe(true);
    expect(ids.has('CAP-PRC-002')).toBe(false);
  });

  it('orders a module by dependencies', () => {
    expect(buildBundle(model, files, 'MOD-CAT').capabilities.map((c) => c.id)).toEqual([
      'CAP-CAT-003',
      'CAP-CAT-001',
      'CAP-CAT-002',
      'CAP-CAT-004',
      'CAP-CAT-005',
      'CAP-CAT-006',
    ]);
  });
});

describe('bundle output', () => {
  const out = (p: string) => readFileSync(join(EXAMPLE, 'handoff', p), 'utf8');

  it('writes a manifest with sources and fingerprints', () => {
    const m = JSON.parse(out('bundle/CAP-PRC-001/manifest.json')) as {
      target: string;
      sources: { id: string; fingerprint: string; version?: number }[];
    };
    expect(m.target).toBe('bundle');
    expect(m.sources.find((s) => s.id === 'CAP-PRC-001')).toMatchObject({
      version: 1,
      fingerprint: expect.stringMatching(/^[0-9a-f]{16}$/),
    });
  });
});

describe('handoff preconditions', () => {
  it('refuses drafts unless --allow-draft, and warns about it', () => {
    const dir = copyFixture();
    expect(() => runHandoff(dir, 'CAP-HR-002')).toThrow(/CAP-HR-002 is draft/);
    expect(runHandoff(dir, 'CAP-HR-002', { allowDraft: true }).warnings[0]).toMatch(/draft/);
  });

  it('refuses scopes with lint errors and IDs that are not a capability or module', () => {
    const dir = copyExample();
    const f = join(dir, 'spec/modules/prc/capabilities/CAP-PRC-001.md');
    writeFileSync(
      f,
      readFileSync(f, 'utf8').replace('rules: [RULE-001, RULE-PRC-001]', 'rules: [RULE-001, RULE-PRC-099]'),
    );
    expect(() => runHandoff(dir, 'CAP-PRC-001')).toThrow(/lint error/);
    expect(() => runHandoff(copyExample(), 'ENT-ARTICLE')).toThrow(/not a capability or module/);
  });

  it('replaces only its own output folder', () => {
    const dir = copyExample();
    runHandoff(dir, 'CAP-PRC-002', { date: '2026-10-07' });
    expect(readdirSync(join(dir, 'handoff/bundle')).sort()).toEqual([
      'CAP-PRC-001',
      'CAP-PRC-002',
      'MOD-PRC',
    ]);
  });
});
