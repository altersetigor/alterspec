import { findBlocks, isEdited, isGeneratedFileEdited } from '../../views/blocks.js';
import type { LintRule, RawFinding } from '../types.js';

export const generatedEdited: LintRule = {
  name: 'generated-edited',
  severity: 'error',
  description: 'GENERATED blocks and files are not edited by hand.',
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const f of model.files) {
      for (const b of findBlocks(f.content)) {
        if (isEdited(b)) {
          out.push({
            file: f.path,
            line: b.line,
            message: `GENERATED block "${b.name}" was edited by hand; change the front-matter and run \`alterspec views\``,
          });
        }
      }
    }
    for (const f of model.raw) {
      if (f.path.startsWith('_generated/') && f.path.endsWith('.md') && isGeneratedFileEdited(f.content)) {
        out.push({
          file: f.path,
          line: 1,
          message: 'generated file was edited by hand; run `alterspec views`',
        });
      }
    }
    return out;
  },
};

export const generatedMissing: LintRule = {
  name: 'generated-missing',
  severity: 'warn',
  description: 'Files keep the GENERATED blocks from their template.',
  check: ({ views }) =>
    views.missing.map((m) => ({
      file: m.file,
      message: `GENERATED block "${m.block}" is missing; add <!-- GENERATED:start ${m.block} --> / <!-- GENERATED:end --> back`,
    })),
};

export const viewsStale: LintRule = {
  name: 'views-stale',
  severity: 'warn',
  description: 'Generated views are up to date (run `alterspec views`).',
  check: ({ model, views }) => {
    const out: RawFinding[] = [];
    const content = new Map(model.raw.map((f) => [f.path, f.content]));
    for (const [file, desired] of views.blocks) {
      for (const b of findBlocks(content.get(file) ?? '')) {
        const want = desired[b.name];
        if (want !== undefined && want !== b.content && !isEdited(b)) {
          out.push({
            file,
            line: b.line,
            message: `GENERATED block "${b.name}" is out of date; run \`alterspec views\``,
          });
        }
      }
    }
    for (const [file, want] of views.files) {
      if (!file.startsWith('_generated/')) continue;
      const have = content.get(file);
      if (have === undefined) out.push({ file, message: `${file} is missing; run \`alterspec views\`` });
      else if (have !== want && !isGeneratedFileEdited(have))
        out.push({ file, line: 1, message: `${file} is out of date; run \`alterspec views\`` });
    }
    return out;
  },
};
