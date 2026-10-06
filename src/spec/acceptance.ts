import { blankComments } from '../lib/collection.js';

export interface AcceptanceHeading {
  /** First word of the `### ` heading, expected to be `<CAP>-AC-NN`. */
  id: string;
  /** 1-based line relative to the body. */
  line: number;
}

/** `### ` headings inside the `## Acceptance criteria` section of a capability body. */
export function acceptanceCriteria(body: string): AcceptanceHeading[] {
  const lines = blankComments(body).split('\n');
  const out: AcceptanceHeading[] = [];
  let inSection = false;
  lines.forEach((l, i) => {
    if (/^## /.test(l)) inSection = /^## acceptance criteria\s*$/i.test(l.trim());
    else if (inSection && /^### \S/.test(l))
      out.push({ id: l.slice(4).trim().split(/\s+/)[0] ?? '', line: i + 1 });
  });
  return out;
}
