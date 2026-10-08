import { findTerms } from '../text.js';
import type { LintRule } from '../types.js';

export const techLeak: LintRule = {
  name: 'tech-leak',
  severity: 'warn',
  description: 'Spec prose contains no technology words (config: lint.tech_terms).',
  check: ({ model, config }) =>
    model.files
      .filter((f) => !f.path.startsWith('experience/'))
      .flatMap((f) =>
        config.lint.tech_terms.flatMap((term) =>
          findTerms(f.content, term).map((h) => ({
            file: f.path,
            line: h.line,
            message: `technology word "${h.match}" in the spec; describe the business need instead`,
          })),
        ),
      ),
};

export const glossaryForbidden: LintRule = {
  name: 'glossary-forbidden',
  severity: 'warn',
  description: 'Spec prose uses canonical glossary terms, not their forbidden synonyms.',
  check: ({ model }) => {
    const terms = model.glossary.flatMap((g) =>
      g.data.forbidden.map((word) => ({ word, canonical: g.data.term })),
    );
    return model.files
      .filter((f) => f.type !== 'glossary')
      .flatMap((f) =>
        terms.flatMap(({ word, canonical }) =>
          findTerms(f.content, word).map((h) => ({
            file: f.path,
            line: h.line,
            message: `"${h.match}" is a forbidden synonym; use "${canonical}"`,
          })),
        ),
      );
  },
};
