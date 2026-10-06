import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { splitFrontMatter } from '../../src/lib/frontmatter.js';
import { extractCapability, listItems, parseAcceptance, parseUserStory } from '../../src/handoff/extract.js';
import { EXAMPLE } from '../example.js';

const body = (p: string) => splitFrontMatter(readFileSync(join(EXAMPLE, 'spec', p), 'utf8')).body;

describe('extract', () => {
  it('parses the user story', () => {
    expect(
      parseUserStory('As a buyer (PER-BUYER), I want to approve a supplier, so that it can offer prices.'),
    ).toEqual({
      raw: 'As a buyer (PER-BUYER), I want to approve a supplier, so that it can offer prices.',
      persona: 'buyer (PER-BUYER)',
      goal: 'approve a supplier',
      benefit: 'it can offer prices',
    });
    expect(parseUserStory('Free text.').goal).toBeUndefined();
  });

  it('parses acceptance criteria with And and Covers', () => {
    const acs = parseAcceptance(
      '\n### X-AC-01\n\n- **Given** a\n- **When** b\n- **Then** c\n- **And** d\n- **Covers:** RULE-001\n\n### X-AC-02\n\n- **Given** e\n- **Given** f\n- **When** g\n- **Then** h\n',
    );
    expect(acs).toEqual([
      { id: 'X-AC-01', given: ['a'], when: ['b'], then: ['c'], and: ['d'], covers: 'RULE-001' },
      { id: 'X-AC-02', given: ['e', 'f'], when: ['g'], then: ['h'], and: [] },
    ]);
  });

  it('reads lists and treats "None." as empty', () => {
    expect(listItems('1. one\n2. two\n')).toEqual(['one', 'two']);
    expect(listItems('- a\n  continued\n- b')).toEqual(['a continued', 'b']);
    expect(listItems('None.')).toEqual([]);
  });

  it('extracts a whole capability of the example', () => {
    const c = extractCapability(body('modules/prc/capabilities/CAP-PRC-002.md'));
    expect(c.userStory.persona).toBe('pricing analyst (PER-PRICING-ANALYST)');
    expect(c.mainFlow).toHaveLength(4);
    expect(c.exceptions).toHaveLength(2);
    expect(c.acceptance.map((a) => a.id)).toEqual([
      'CAP-PRC-002-AC-01',
      'CAP-PRC-002-AC-02',
      'CAP-PRC-002-AC-03',
    ]);
    expect(c.acceptance[0]?.and).toEqual(['the price of 9.00 is expired']);
    expect(c.openQuestions).toEqual([
      'Must the approver be a different person from the one who proposed the price?',
    ]);
    expect(c.sections['Notifications']).toContain('Sales staff see the new price');
  });
});
