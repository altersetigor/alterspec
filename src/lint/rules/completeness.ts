import { sectionStatus, type SectionedType } from '../../spec/sections.js';
import type { LintRule, RawFinding } from '../types.js';

const REFINED = new Set(['refined', 'ready', 'approved', 'implemented']);

export const incompleteSection: LintRule = {
  name: 'incomplete-section',
  severity: 'warn',
  description:
    'Capabilities, screens and entities that are refined or later have every template section filled in.',
  check: ({ model }) => {
    const out: RawFinding[] = [];
    const groups: [
      SectionedType,
      Iterable<{
        id: string;
        file: string;
        line: number;
        body: string;
        bodyLine: number;
        data: { status: string };
      }>,
    ][] = [
      ['capability', model.capabilities.values()],
      ['screen', model.screens.values()],
      ['entity', model.entities.values()],
    ];
    for (const [type, objects] of groups) {
      for (const o of objects) {
        if (!REFINED.has(o.data.status)) continue;
        for (const s of sectionStatus(type, o.body)) {
          if (!s.empty) continue;
          out.push({
            file: o.file,
            line: s.line === undefined ? o.line : o.bodyLine - 1 + s.line,
            id: o.id,
            message: s.missing
              ? `${o.id} is ${o.data.status} but has no "${s.heading}" section`
              : `${o.id} is ${o.data.status} but "${s.heading}" is empty; write it or put "None."`,
          });
        }
      }
    }
    return out;
  },
};
