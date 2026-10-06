import { describe, expect, it } from 'vitest';
import { fingerprint, specObjects, withoutGenerated } from '../../src/changes/fingerprint.js';
import { mergeChange, removeItem, upsertItem } from '../../src/changes/merge.js';
import type { LoadedChange } from '../../src/changes/change.js';
import { fixtureFiles } from '../fixture.js';

const change = (overlay: Record<string, string>, removes: string[] = []): LoadedChange => ({
  id: 'CHG-001',
  dir: '/x',
  overlayRoot: '/x/spec',
  proposalPath: '/x/proposal.md',
  proposal: { id: 'CHG-001', title: 't', status: 'draft', created: '2026-10-07', removes, base: {} },
  overlay: Object.entries(overlay).map(([path, content]) => ({ path, content })),
});
const fileOf = (files: { path: string; content: string }[], p: string) =>
  files.find((f) => f.path === p)?.content;

describe('fingerprints', () => {
  it('keys documents by ID, items by ID or term, prose by file', () => {
    const keys = [...specObjects(fixtureFiles()).keys()];
    expect(keys).toEqual(
      expect.arrayContaining([
        'APP',
        'MOD-HR',
        'CAP-HR-001',
        'ENT-EMPLOYEE',
        'FLOW-001',
        'RULE-HR-001',
        'ROLE-EMPLOYEE',
        'PER-HR-LEAD',
        'EVT-EMPLOYEE-HIRED',
        'DEC-001',
        'term:Employee',
        'file:application/nfr.md',
      ]),
    );
    expect(keys.some((k) => k.startsWith('file:_generated') || k.includes('changes/'))).toBe(false);
  });

  it('ignore GENERATED block content', () => {
    const a = '# x\n<!-- GENERATED:start b hash=aaaaaaaaaaaa -->\none\n<!-- GENERATED:end -->\n';
    const b = '# x\n<!-- GENERATED:start b hash=bbbbbbbbbbbb -->\ntwo\n<!-- GENERATED:end -->\n';
    expect(withoutGenerated(a)).toBe(withoutGenerated(b));
    expect(fingerprint({ kind: 'doc', text: a })).toBe(fingerprint({ kind: 'doc', text: b }));
  });
});

describe('mergeChange', () => {
  const files = fixtureFiles();

  it('replaces and adds whole documents and prose files', () => {
    const merged = mergeChange(
      files,
      change({
        'modules/hr/capabilities/CAP-HR-002.md': 'new cap',
        'modules/hr/capabilities/CAP-HR-009.md': 'added cap',
        'application/nfr.md': 'new nfr',
      }),
    );
    expect(fileOf(merged, 'modules/hr/capabilities/CAP-HR-002.md')).toBe('new cap');
    expect(fileOf(merged, 'modules/hr/capabilities/CAP-HR-009.md')).toBe('added cap');
    expect(fileOf(merged, 'application/nfr.md')).toBe('new nfr');
    expect(fileOf(merged, 'modules/hr/capabilities/CAP-HR-001.md')).toBe(
      fileOf(files, 'modules/hr/capabilities/CAP-HR-001.md'),
    );
  });

  it('replaces items by key and inserts new ones (personas above roles)', () => {
    const merged = mergeChange(
      files,
      change({
        'application/rules.md':
          '## RULE-001 Changed\n\n```yaml\nid: RULE-001\ntitle: Changed\nstatus: draft\n```\n',
        'application/personas-roles.md':
          '## PER-AUDITOR Auditor\n\n```yaml\nid: PER-AUDITOR\ntitle: Auditor\n```\n',
        'application/glossary.md':
          '## Payslip\n\n```yaml\nterm: Payslip\nforbidden: [salary slip, pay stub]\n```\n',
      }),
    );
    const rules = fileOf(merged, 'application/rules.md')!;
    expect(rules).toContain('## RULE-001 Changed');
    expect(rules).not.toContain('Only active employees are paid');
    const people = fileOf(merged, 'application/personas-roles.md')!;
    expect(people.indexOf('## PER-AUDITOR')).toBeLessThan(people.indexOf('# Roles'));
    expect(people.indexOf('## PER-AUDITOR')).toBeGreaterThan(people.indexOf('## PER-EMPLOYEE'));
    expect(fileOf(merged, 'application/glossary.md')).toContain('pay stub');
    expect(fileOf(merged, 'application/glossary.md')!.match(/## Payslip/g)).toHaveLength(1);
  });

  it('creates a missing module rules file from its template', () => {
    const merged = mergeChange(
      files,
      change({
        'modules/pay/rules.md':
          '## RULE-PAY-001 Positive\n\n```yaml\nid: RULE-PAY-001\ntitle: Positive\nstatus: draft\n```\n',
      }),
    );
    const text = fileOf(merged, 'modules/pay/rules.md')!;
    expect(text).toMatch(/^# Business rules — MOD-PAY/);
    expect(text).toContain('## RULE-PAY-001 Positive');
  });

  it('removes documents and items', () => {
    const merged = mergeChange(
      files,
      change({}, ['CAP-HR-003', 'ROLE-EMPLOYEE', 'term:Payslip', 'file:application/nfr.md']),
    );
    expect(fileOf(merged, 'modules/hr/capabilities/CAP-HR-003.md')).toBeUndefined();
    expect(fileOf(merged, 'application/nfr.md')).toBeUndefined();
    expect(fileOf(merged, 'application/personas-roles.md')).not.toContain('## ROLE-EMPLOYEE');
    expect(fileOf(merged, 'application/personas-roles.md')).toContain('## PER-EMPLOYEE');
    expect(fileOf(merged, 'application/glossary.md')).not.toContain('## Payslip');
  });

  it('upsert and remove keep the file tidy', () => {
    const base = '# T\n\n## A-1 a\n\ntext\n\n## A-2 b\n\ntext\n';
    expect(removeItem(base, 'rules', 'A-1')).toBe('# T\n\n## A-2 b\n\ntext\n');
    expect(upsertItem(base, 'rules', { key: 'A-3', text: '## A-3 c\n' })).toBe(base + '\n## A-3 c\n');
  });
});
