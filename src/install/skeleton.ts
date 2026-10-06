/**
 * Turn a collection template into an empty spec file: keep the headings and guidance,
 * drop the example `## ` items (each runs until the next `# ` or `## ` heading).
 */
export function stripItems(template: string): string {
  const out: string[] = [];
  let inItem = false;
  let inFence = false;
  for (const line of template.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence;
    if (!inFence && /^#{1,2} /.test(line)) inItem = line.startsWith('## ');
    if (!inItem) out.push(line);
  }
  return (
    out
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd() + '\n'
  );
}

/** The example `## ` items of a collection template (the parts `stripItems` drops). */
export function extractItems(template: string): string[] {
  const items: string[] = [];
  let current: string[] | undefined;
  let inFence = false;
  for (const line of template.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence;
    if (!inFence && /^#{1,2} /.test(line)) {
      if (current) items.push(current.join('\n').trimEnd() + '\n');
      current = line.startsWith('## ') ? [line] : undefined;
      continue;
    }
    current?.push(line);
  }
  if (current) items.push(current.join('\n').trimEnd() + '\n');
  return items;
}
