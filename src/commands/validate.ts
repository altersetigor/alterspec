import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { packageVersion } from '../assets.js';
import { loadConfig } from '../config.js';
import { lint, summarize } from '../lint/lint.js';
import { RULES } from '../lint/rules/index.js';
import type { Finding } from '../lint/types.js';
import { readSpecDir } from '../spec/files.js';
import { loadSpec } from '../spec/load.js';
import { lintMerged, mergedFiles } from '../changes/impact.js';

export interface ValidateOptions {
  spec?: string;
  report?: boolean;
  /** Validate the spec as it would be after this change is applied. */
  change?: string;
}

export interface ValidateResult {
  version: string;
  summary: { errors: number; warnings: number };
  findings: Finding[];
}

export function runValidate(dir: string, opts: ValidateOptions = {}): ValidateResult {
  const root = resolve(dir);
  const specRoot = join(root, opts.spec ?? 'spec');
  const findings = opts.change
    ? lintMerged(root, mergedFiles(specRoot, opts.change, root).merged)
    : lint(loadSpec(readSpecDir(specRoot)), loadConfig(root), root);
  const result = { version: packageVersion(), summary: summarize(findings), findings };
  if (opts.report) {
    mkdirSync(join(specRoot, '_generated'), { recursive: true });
    writeFileSync(join(specRoot, '_generated/lint-report.md'), reportMarkdown(result));
  }
  return result;
}

const where = (f: Finding) => (f.line ? `${f.file}:${f.line}` : f.file);

export function formatHuman(result: ValidateResult, specDir = 'spec'): string {
  const lines: string[] = [];
  let current = '';
  for (const f of result.findings) {
    if (f.file !== current) {
      if (current) lines.push('');
      lines.push(`${specDir}/${f.file}`);
      current = f.file;
    }
    lines.push(
      `  ${String(f.line ?? '').padStart(4)}  ${f.severity.padEnd(5)}  ${f.rule.padEnd(30)}  ${f.message}`,
    );
  }
  const { errors, warnings } = result.summary;
  if (lines.length) lines.push('');
  lines.push(errors + warnings === 0 ? '✓ No findings.' : `${errors} error(s), ${warnings} warning(s)`);
  return lines.join('\n');
}

function reportMarkdown(result: ValidateResult): string {
  const { errors, warnings } = result.summary;
  const rows = result.findings.map(
    (f) => `| ${f.severity} | ${f.rule} | ${where(f)} | ${f.message.replace(/\|/g, '\\|')} |`,
  );
  return [
    '<!-- written by `alterspec validate --report`; do not edit -->',
    '',
    '# Lint report',
    '',
    `${errors} error(s), ${warnings} warning(s).`,
    '',
    ...(rows.length
      ? ['| Severity | Rule | Location | Message |', '| --- | --- | --- | --- |', ...rows]
      : ['_No findings._']),
    '',
  ].join('\n');
}

export function listRules(): string {
  return RULES.map((r) => `${r.name.padEnd(32)} ${r.severity.padEnd(5)}  ${r.description}`).join('\n');
}
