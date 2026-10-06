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
    runHandoff(dir, 'CAP-PRC-001', { target: 'all', date: '2026-10-07' });
    runHandoff(dir, 'MOD-PRC', { target: 'bundle', date: '2026-10-07' });
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

describe('target formats', () => {
  const out = (p: string) => readFileSync(join(EXAMPLE, 'handoff', p), 'utf8');

  it('OpenSpec: SHALL/MUST requirements with 4-hash scenarios, Why and Purpose lengths, kebab-case id', () => {
    const changeDir = readdirSync(join(EXAMPLE, 'handoff/openspec/CAP-PRC-001')).find(
      (n) => n !== 'manifest.json',
    )!;
    expect(changeDir).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    const proposal = out(`openspec/CAP-PRC-001/${changeDir}/proposal.md`);
    const why = /## Why\n\n([\s\S]*?)\n\n## /.exec(proposal)?.[1] ?? '';
    expect(why.length).toBeGreaterThanOrEqual(50);
    expect(why.length).toBeLessThanOrEqual(1000);
    expect(proposal).toMatch(/## What Changes\n\n- /);
    const spec = out(`openspec/CAP-PRC-001/${changeDir}/specs/pricing/spec.md`);
    const purpose = /## Purpose\n\n(.*)\n/.exec(spec)?.[1] ?? '';
    expect(purpose.length).toBeGreaterThanOrEqual(50);
    const reqs = spec.split(/^### Requirement: /m).slice(1);
    expect(reqs.length).toBeGreaterThan(0);
    for (const r of reqs) {
      expect(r).toMatch(/\b(SHALL|MUST)\b/);
      expect(r).toMatch(/^#### Scenario: /m);
      expect(r).not.toMatch(/^(###|#####) Scenario:/m);
      for (const sc of r.split(/^#### Scenario: /m).slice(1)) {
        expect(sc).toMatch(/^- \*\*WHEN\*\* /m);
        expect(sc).toMatch(/^- \*\*THEN\*\* /m);
      }
    }
    expect(out(`openspec/CAP-PRC-001/${changeDir}/tasks.md`)).toMatch(/^## 1\. .+\n\n- \[ \] 1\.1 /m);
  });

  it('Spec Kit: mandatory sections, sequential FR and SC, priorities', () => {
    const spec = out('speckit/CAP-PRC-001/spec.md');
    for (const h of [
      '## User Scenarios & Testing *(mandatory)*',
      '## Requirements *(mandatory)*',
      '### Functional Requirements',
      '### Key Entities',
      '## Success Criteria *(mandatory)*',
      '## Assumptions',
      '### Edge Cases',
    ]) {
      expect(spec).toContain(h);
    }
    expect(spec).toMatch(/^### User Story 1 - .+ \(Priority: P1\)$/m);
    const frs = [...spec.matchAll(/\*\*FR-(\d{3})\*\*: System MUST/g)].map((m) => Number(m[1]));
    expect(frs).toEqual(frs.map((_, i) => i + 1));
    expect(spec).toMatch(/\[NEEDS CLARIFICATION: Do sales prices differ per customer group\?\]/);
    expect(spec).toMatch(/^1\. \*\*Given\*\* .+, \*\*When\*\* .+, \*\*Then\*\* /m);
    expect(spec).toMatch(/\*\*SC-001\*\*: /);
  });

  it('BMAD: epic and story numbering with Given/When/Then', () => {
    const epics = out('bmad/CAP-PRC-001/epics.md');
    expect(epics).toMatch(/^## Epic 1: Pricing$/m);
    expect(epics).toMatch(/^### Story 1\.1: Propose sales price$/m);
    expect(epics).toMatch(/^As a .+,\nI want to .+,\nSo that .+\.$/m);
    expect(epics).toMatch(/^\*\*Given\*\* .+\n\*\*When\*\* .+\n\*\*Then\*\* /m);
    expect(epics).toMatch(/^FR1: .+\n/m);
    expect(epics).toMatch(/^FR1: Epic 1 - Story 1\.1$/m);
  });

  it('writes a manifest with sources and fingerprints', () => {
    const m = JSON.parse(out('speckit/CAP-PRC-001/manifest.json')) as {
      target: string;
      sources: { id: string; fingerprint: string; version?: number }[];
    };
    expect(m.target).toBe('speckit');
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

  it('refuses scopes with lint errors and unknown targets', () => {
    const dir = copyExample();
    const f = join(dir, 'spec/modules/prc/capabilities/CAP-PRC-001.md');
    writeFileSync(
      f,
      readFileSync(f, 'utf8').replace('rules: [RULE-001, RULE-PRC-001]', 'rules: [RULE-001, RULE-PRC-099]'),
    );
    expect(() => runHandoff(dir, 'CAP-PRC-001')).toThrow(/lint error/);
    expect(() => runHandoff(copyExample(), 'CAP-PRC-001', { target: 'jira' })).toThrow(/--target/);
    expect(() => runHandoff(copyExample(), 'ENT-ARTICLE')).toThrow(/not a capability or module/);
  });

  it('replaces only its own output folder', () => {
    const dir = copyExample();
    runHandoff(dir, 'CAP-PRC-002', { target: 'speckit', date: '2026-10-07' });
    expect(readdirSync(join(dir, 'handoff/speckit')).sort()).toEqual(['CAP-PRC-001', 'CAP-PRC-002']);
  });
});
