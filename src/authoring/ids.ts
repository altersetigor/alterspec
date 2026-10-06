import type { SpecFile } from '../spec/files.js';

/**
 * Next free number for a numbered ID family, e.g. prefix `CAP-HR-` with 3 digits.
 * Scans the paths and raw text of every spec file, including changes/archive/ and generated output,
 * so an ID that was ever used — even if later removed — is never handed out again.
 */
export function nextNumber(files: SpecFile[], prefix: string, digits: number): string {
  const re = new RegExp(`(?<![A-Z0-9-])${prefix.replace(/-/g, '\\-')}(\\d{${digits}})(?![0-9])`, 'g');
  let max = 0;
  for (const f of files) {
    for (const m of `${f.path}\n${f.content}`.matchAll(re)) max = Math.max(max, Number(m[1]));
  }
  const next = max + 1;
  if (String(next).length > digits) throw new Error(`no free ${prefix}${'N'.repeat(digits)} IDs left`);
  return String(next).padStart(digits, '0');
}
