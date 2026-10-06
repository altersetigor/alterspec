import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeImpact } from '../src/changes/impact.js';
import { runValidate } from '../src/commands/validate.js';
import { runViews } from '../src/commands/views.js';
import { EXAMPLE } from './example.js';

describe('Product Catalog example', () => {
  it('validates with no findings, including the baseline', () => {
    expect(runValidate(EXAMPLE).findings).toEqual([]);
    expect(existsSync(join(EXAMPLE, 'spec/_generated/baseline.json'))).toBe(true);
  });

  it('has current views', () => {
    expect(runViews(EXAMPLE, { check: true }).changed).toEqual([]);
  });

  it('keeps CHG-001 applied in the archive, with CAP-PRC-002 at version 2', () => {
    expect(readFileSync(join(EXAMPLE, 'spec/changes/archive/CHG-001/proposal.md'), 'utf8')).toMatch(
      /status: applied/,
    );
    expect(readFileSync(join(EXAMPLE, 'spec/modules/prc/capabilities/CAP-PRC-002.md'), 'utf8')).toMatch(
      /^version: 2$/m,
    );
    expect(readFileSync(join(EXAMPLE, 'spec/modules/prc/rules.md'), 'utf8')).toContain('## RULE-PRC-002');
  });

  it('has CHG-002 in review, clean when merged', () => {
    expect(readFileSync(join(EXAMPLE, 'spec/changes/CHG-002/proposal.md'), 'utf8')).toMatch(
      /status: in_review/,
    );
    expect(runValidate(EXAMPLE, { change: 'CHG-002' }).findings).toEqual([]);
    const impact = computeImpact(EXAMPLE, 'CHG-002');
    expect(impact.conflicts).toEqual([]);
    expect(impact.modified.map((m) => m.key)).toEqual(['CAP-CAT-006', 'ENT-ARTICLE']);
  });

  it('is product-only: no framework folders committed', () => {
    expect(existsSync(join(EXAMPLE, '.alterspec'))).toBe(false);
    expect(existsSync(join(EXAMPLE, '.claude'))).toBe(false);
  });
});
