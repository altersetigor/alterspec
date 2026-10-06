import type { Config } from '../schemas/config.js';
import type { SpecModel } from '../spec/model.js';
import type { ViewsPlan } from '../views/plan.js';

export type Severity = 'error' | 'warn';

export interface Finding {
  rule: string;
  severity: Severity;
  /** Path relative to the spec folder. */
  file: string;
  line?: number;
  /** The spec object the finding is about, when there is one. */
  id?: string;
  message: string;
}

/** A finding before the rule's severity is applied. */
export type RawFinding = Omit<Finding, 'severity' | 'rule'>;

export interface LintContext {
  model: SpecModel;
  config: Config;
  /** IDs defined in files that failed validation; references to them are not reported again. */
  invalidIds: Set<string>;
  /** What `alterspec views` would write now. */
  views: ViewsPlan;
}

export interface LintRule {
  name: string;
  severity: Severity;
  description: string;
  check: (ctx: LintContext) => RawFinding[];
}
