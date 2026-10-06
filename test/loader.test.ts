import { describe, expect, it } from 'vitest';
import { findTerms, proseLines, termMatcher } from '../src/lint/text.js';
import { YamlSource } from '../src/lib/yaml-lines.js';
import { classify, isIgnored } from '../src/spec/load.js';
import { loadFixture } from './fixture.js';

describe('loader', () => {
  it('loads every object of the fixture', () => {
    const { model, findings } = loadFixture();
    expect(findings).toEqual([]);
    expect([...model.modules.keys()].sort()).toEqual(['MOD-GLB', 'MOD-HR', 'MOD-PAY']);
    expect(model.capabilities.size).toBe(6);
    expect(model.screens.size).toBe(3);
    expect(model.entities.size).toBe(2);
    expect(model.flows.size).toBe(2);
    expect([...model.rules.keys()].sort()).toEqual(['RULE-001', 'RULE-HR-001']);
    expect(model.roles.size).toBe(3);
    expect(model.personas.size).toBe(3);
    expect(model.events.size).toBe(2);
    expect(model.decisions.size).toBe(1);
    expect(model.glossary.map((g) => g.data.term)).toEqual(['Employee', 'Payslip']);
    expect(model.moduleDirs).toEqual(new Set(['glb', 'hr', 'pay']));
  });

  it('records where each object is', () => {
    const { model } = loadFixture();
    const rule = model.rules.get('RULE-HR-001')!;
    expect(rule.file).toBe('modules/hr/rules.md');
    expect(rule.line).toBe(3);
    expect(rule.lineOf(['entities'])).toBe(9);
    const cap = model.capabilities.get('CAP-HR-002')!;
    expect(cap.lineOf(['entities', 0, 'transitions', 0])).toBe(14);
    expect(cap.bodyLine).toBe(20);
  });

  it('classifies locations and ignores generated, archived and README files', () => {
    expect(classify({ path: 'modules/hr/capabilities/CAP-HR-001.md', content: '' })).toMatchObject({
      type: 'capability',
      parts: { mod: 'hr', name: 'CAP-HR-001' },
    });
    expect(classify({ path: 'changes/CHG-001/deltas/CAP-HR-001.md', content: '' })).toMatchObject({
      type: 'delta',
      parts: { change: 'CHG-001' },
    });
    expect(classify({ path: 'modules/hr/notes.md', content: '' }).type).toBeUndefined();
    for (const p of [
      '_generated/coverage.md',
      'changes/archive/CHG-001/proposal.md',
      'modules/README.md',
      'screens/a.png',
    ]) {
      expect(isIgnored(p), p).toBe(true);
    }
  });
});

describe('YamlSource', () => {
  it('maps paths to file lines, falling back to the parent', () => {
    const src = new YamlSource('a: 1\nlist:\n  - x\n  - y\nempty:\n', 2);
    expect(src.lineOf(['a'])).toBe(2);
    expect(src.lineOf(['list', 1])).toBe(5);
    expect(src.lineOf(['empty'])).toBe(6);
    expect(src.lineOf(['missing', 3])).toBe(2);
  });

  it('reports syntax errors with a file line', () => {
    const src = new YamlSource('a: 1\nb: [x\n', 10);
    expect(src.error?.line).toBeGreaterThanOrEqual(11);
    expect(src.data).toBeUndefined();
  });
});

describe('prose scanning', () => {
  const doc = [
    '---',
    'title: database',
    '---',
    'Real database mention.',
    '<!-- database in a comment -->',
    '```yaml',
    'database: true',
    '```',
    'Inline `database` code and [link](http://database.example).',
    '<!-- GENERATED:start x hash=000000000000 -->',
    'database',
    '<!-- GENERATED:end -->',
  ].join('\n');

  it('only scans prose and keeps line numbers', () => {
    expect(proseLines(doc)).toHaveLength(12);
    expect(findTerms(doc, 'database')).toEqual([{ line: 4, match: 'database' }]);
  });

  it('matches whole words; all-caps terms are case-sensitive', () => {
    expect('a REST call'.match(termMatcher('REST'))).toHaveLength(1);
    expect('a rest period'.match(termMatcher('REST'))).toBeNull();
    expect('Java and JavaScript'.match(termMatcher('Java'))).toHaveLength(1);
    expect('Salary Slip'.match(termMatcher('salary slip'))).toHaveLength(1);
    expect('Node.js app'.match(termMatcher('Node.js'))).toHaveLength(1);
  });
});
