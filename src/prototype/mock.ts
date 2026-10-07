import type { Entity } from '../schemas/entity.js';

export interface MockRecord {
  /** How the record is named in lists and references. */
  label: string;
  /** Lifecycle state, when the entity has states. */
  state?: string;
  /** Display value per attribute name. */
  values: Record<string, string>;
}

/** Records per entity. Enough to show a list, few enough to read. */
export const MOCK_RECORDS = 5;

/** Small deterministic hash (FNV-1a), so mock values depend only on the spec. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const BASE_DATE = Date.UTC(2026, 0, 5);
const DAY = 86_400_000;

function value(
  entity: Entity,
  a: Entity['attributes'][number],
  i: number,
  refs: (target: string) => string[],
): string {
  const h = hash(`${entity.id}|${a.name}|${i}`);
  switch (a.kind) {
    case 'number':
      return String(1 + (h % 500));
    case 'amount':
      return ((100 + (h % 99_900)) / 100).toFixed(2);
    case 'date':
      return new Date(BASE_DATE + (i * 23 + (h % 20)) * DAY).toISOString().slice(0, 10);
    case 'period':
      return `2026-${String(1 + ((i - 1) % 12)).padStart(2, '0')}`;
    case 'yes_no':
      return i % 2 ? 'Yes' : 'No';
    case 'choice': {
      const o = a.options ?? [];
      return o.length ? o[(i - 1) % o.length]! : `${a.name} option ${i}`;
    }
    case 'reference': {
      const r = a.references ? refs(a.references) : [];
      return r.length ? r[(i - 1) % r.length]! : `${a.name} ${i}`;
    }
    case 'document':
      return `${a.name} ${i}`;
    default:
      return `${a.name} ${i}`;
  }
}

/**
 * Deterministic example records for an entity. States cycle through the lifecycle so every state shows up.
 * `refs` names the records of a referenced entity.
 */
export function mockRecords(entity: Entity, refs: (target: string) => string[]): MockRecord[] {
  const labelAttr = entity.attributes.find((a) => a.kind === 'text');
  return Array.from({ length: MOCK_RECORDS }, (_, n) => {
    const i = n + 1;
    const values = Object.fromEntries(entity.attributes.map((a) => [a.name, value(entity, a, i, refs)]));
    return {
      label: labelAttr ? values[labelAttr.name]! : `${entity.title} ${i}`,
      ...(entity.states.length ? { state: entity.states[n % entity.states.length]! } : {}),
      values,
    };
  });
}
