import type { Config } from '../schemas/config.js';
import type { LoadResult } from '../spec/load.js';
import { planViews } from '../views/plan.js';
import { RULES } from './rules/index.js';
import type { Finding, LintContext } from './types.js';

export function lint(load: LoadResult, config: Config): Finding[] {
  const ctx: LintContext = {
    model: load.model,
    config,
    invalidIds: load.invalidIds,
    views: planViews(load.model),
  };
  const severityOf = (rule: string) => {
    const override = config.lint.rules[rule];
    if (override === 'off') return undefined;
    return override ?? RULES.find((r) => r.name === rule)?.severity ?? 'error';
  };
  const findings: Finding[] = [];
  const push = (rule: string, f: Omit<Finding, 'severity' | 'rule'>) => {
    const severity = severityOf(rule);
    if (severity) findings.push({ rule, severity, ...f });
  };
  for (const { rule, ...f } of load.findings) push(rule, f);
  for (const rule of RULES) {
    if (config.lint.rules[rule.name] === 'off') continue;
    for (const f of rule.check(ctx)) push(rule.name, f);
  }
  return findings.sort(
    (a, b) => a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0) || a.rule.localeCompare(b.rule),
  );
}

export function summarize(findings: Finding[]) {
  return {
    errors: findings.filter((f) => f.severity === 'error').length,
    warnings: findings.filter((f) => f.severity === 'warn').length,
  };
}
