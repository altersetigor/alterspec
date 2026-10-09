import { stripItems } from '../install/skeleton.js';
import { splitItems } from '../lib/collection.js';
import { renderTemplate } from '../lib/template.js';
import { readTemplate } from '../lib/templates.js';
import { SPEC_TYPES } from '../schemas/index.js';
import type { SpecFile } from '../spec/files.js';
import { classify } from '../spec/load.js';
import type { LoadedChange } from './change.js';
import { fingerprint, itemKey, specObjects, type SpecObject } from './fingerprint.js';

const COLLECTIONS = new Set(['personas-roles', 'glossary', 'rules', 'module-rules', 'events', 'decisions']);

const tidy = (s: string) => s.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

/** Empty collection file for a path, from its template (module rules get their module code). */
function emptyCollection(type: string, path: string, root?: string): string {
  const def = SPEC_TYPES[type as keyof typeof SPEC_TYPES];
  const tpl = readTemplate(root, def.template);
  const code = /^modules\/([^/]+)\//.exec(path)?.[1]?.toUpperCase() ?? '';
  return renderTemplate(stripItems(tpl), { MOD: code });
}

/** Put one item into a collection file: replace the item with the same key, or insert it. */
export function upsertItem(content: string, type: string, item: { key: string; text: string }): string {
  const existing = splitItems(content).find((i) => itemKey(type, i) === item.key);
  const text = item.text.trimEnd() + '\n\n';
  if (existing) return tidy(content.slice(0, existing.start) + text + content.slice(existing.end));
  if (item.key.startsWith('PER-')) {
    const roles = /^# Roles\s*$/m.exec(content);
    if (roles) return tidy(content.slice(0, roles.index) + text + content.slice(roles.index));
  }
  return tidy(content.trimEnd() + '\n\n' + text);
}

/** Remove an item section from a collection file. */
export function removeItem(content: string, type: string, key: string): string {
  const existing = splitItems(content).find((i) => itemKey(type, i) === key);
  return existing ? tidy(content.slice(0, existing.start) + content.slice(existing.end)) : content;
}

/** Objects in a change overlay (same keys as in the spec). */
export function overlayObjects(change: LoadedChange): Map<string, SpecObject> {
  return specObjects(change.overlay);
}

/**
 * The spec files as they would be after applying the change (other files unchanged). With the project root, a
 * collection file the change creates starts from the project's template override when there is one.
 */
export function mergeChange(files: SpecFile[], change: LoadedChange, root?: string): SpecFile[] {
  const out = new Map(files.map((f) => [f.path, f.content]));
  for (const f of change.overlay) {
    const { type } = classify(f);
    if (type && COLLECTIONS.has(type)) {
      let content = out.get(f.path) ?? emptyCollection(type, f.path, root);
      for (const item of splitItems(f.content)) {
        content = upsertItem(content, type, { key: itemKey(type, item), text: item.text });
      }
      out.set(f.path, content);
    } else {
      out.set(f.path, f.content);
    }
  }
  const merged = () => [...out].map(([path, content]) => ({ path, content }));
  for (const key of change.proposal.removes) {
    const obj = specObjects(merged()).get(key);
    if (!obj) continue;
    if (obj.kind === 'item') {
      const { type } = classify({ path: obj.file, content: '' });
      out.set(obj.file, removeItem(out.get(obj.file) ?? '', type ?? '', key));
    } else {
      out.delete(obj.file);
    }
  }
  return merged();
}

export interface Conflict {
  key: string;
  message: string;
}

/** Objects that changed in the spec since the change started touching them. */
export function conflicts(files: SpecFile[], change: LoadedChange): Conflict[] {
  const current = specObjects(files);
  const out: Conflict[] = [];
  for (const [key, base] of Object.entries(change.proposal.base)) {
    const cur = current.get(key);
    if (base === null && cur)
      out.push({ key, message: `${key} is new in ${change.id} but now also exists in the spec` });
    else if (base !== null && !cur)
      out.push({ key, message: `${key} was removed from the spec after ${change.id} started` });
    else if (base !== null && cur && fingerprint(cur) !== base) {
      out.push({
        key,
        message: `${key} changed in the spec after ${change.id} started; run \`alterspec change edit\` again after re-reading it`,
      });
    }
  }
  return out;
}
