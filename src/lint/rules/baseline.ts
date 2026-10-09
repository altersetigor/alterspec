import { parseBaseline } from '../../changes/baseline.js';
import { fingerprint, specObjects } from '../../changes/fingerprint.js';
import type { LintRule, RawFinding } from '../types.js';

export const directEdit: LintRule = {
  name: 'direct-edit',
  severity: 'error',
  description: 'After `alterspec baseline`, the spec changes only through applied change proposals.',
  check: ({ model }) => {
    const baseline = parseBaseline(model.raw);
    if (!baseline) return [];
    const out: RawFinding[] = [];
    const current = specObjects(model.raw);
    const how = 'make the edit through a change proposal (/alterspec-groom), or undo it';
    for (const [key, o] of current) {
      const base = baseline.objects[key];
      if (!base)
        out.push({ file: o.file, line: o.line, id: key, message: `${key} was added directly; ${how}` });
      else if (base.hash !== fingerprint(o))
        out.push({ file: o.file, line: o.line, id: key, message: `${key} was edited directly; ${how}` });
    }
    for (const [key, base] of Object.entries(baseline.objects)) {
      if (!current.has(key))
        out.push({ file: base.file, id: key, message: `${key} was removed directly; ${how}` });
    }
    return out;
  },
};
