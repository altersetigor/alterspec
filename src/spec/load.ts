import { posix } from 'node:path';
import type { z } from 'zod';
import type { Finding } from '../lint/types.js';
import { parseCollection } from '../lib/collection.js';
import { splitFrontMatter } from '../lib/frontmatter.js';
import { YamlSource } from '../lib/yaml-lines.js';
import { SPEC_TYPES, itemSchemaFor, type CollectionType, type DocumentType } from '../schemas/index.js';
import type { SpecFile } from './files.js';
import {
  emptyModel,
  type ClassifiedFile,
  type FileType,
  type Located,
  type LocatedDoc,
  type SpecModel,
} from './model.js';

const LOCATIONS: [FileType, RegExp][] = [
  ['application', /^application\/application\.md$/],
  ['personas-roles', /^application\/personas-roles\.md$/],
  ['glossary', /^application\/glossary\.md$/],
  ['rules', /^application\/rules\.md$/],
  ['events', /^application\/events\.md$/],
  ['decisions', /^application\/decisions\.md$/],
  ['prose', /^application\/(?:integrations|nfr)\.md$/],
  ['prose', /^experience\/(?:design-system|patterns)\.md$/],
  ['experience', /^experience\/screens\/(?<name>[^/]+)\.md$/],
  ['entity', /^application\/entities\/(?<name>[^/]+)\.md$/],
  ['flow', /^application\/flows\/(?<name>[^/]+)\.md$/],
  ['module', /^modules\/(?<mod>[^/]+)\/module\.md$/],
  ['module-rules', /^modules\/(?<mod>[^/]+)\/rules\.md$/],
  ['capability', /^modules\/(?<mod>[^/]+)\/capabilities\/(?<name>[^/]+)\.md$/],
  ['screen', /^modules\/(?<mod>[^/]+)\/screens\/(?<name>[^/]+)\.md$/],
  ['change', /^changes\/(?<change>[^/]+)\/proposal\.md$/],
];

/** Files the loader never reads: generated output, archived changes, READMEs, non-markdown. */
export function isIgnored(path: string): boolean {
  return (
    path.startsWith('_generated/') ||
    path.startsWith('changes/archive/') ||
    /^changes\/[^/]+\/spec\//.test(path) ||
    /^changes\/[^/]+\/(impact|groom(?:-[^/]+)?)\.md$/.test(path) ||
    posix.basename(path).toLowerCase() === 'readme.md' ||
    !path.endsWith('.md')
  );
}

export function classify(file: SpecFile): ClassifiedFile {
  for (const [type, re] of LOCATIONS) {
    const m = re.exec(file.path);
    if (m) return { ...file, type, parts: { ...m.groups } };
  }
  return { ...file, type: undefined, parts: {} };
}

export interface LoadResult {
  model: SpecModel;
  /** Findings from loading: yaml-syntax, schema, unrecognized-file. Severity is applied by the linter. */
  findings: Omit<Finding, 'severity'>[];
  /** IDs defined in files whose front-matter or item failed validation (not in the model). */
  invalidIds: Set<string>;
}

type LoaderFinding = LoadResult['findings'][number];

/** Build the spec model from files. Never throws on bad content; reports findings instead. */
export function loadSpec(files: SpecFile[]): LoadResult {
  const model = emptyModel();
  model.raw = files;
  const findings: LoaderFinding[] = [];
  const invalidIds = new Set<string>();

  const define = (id: string, file: string, line: number) => {
    const list = model.definitions.get(id) ?? [];
    list.push({ file, line });
    model.definitions.set(id, list);
  };

  const validate = <T>(
    schema: z.ZodType,
    src: YamlSource,
    file: string,
    line: number,
    what: string,
  ): Located<T> | undefined => {
    if (src.error) {
      findings.push({
        rule: 'yaml-syntax',
        file,
        line: src.error.line,
        message: `${what}: ${src.error.message}`,
      });
      return undefined;
    }
    const rawId = (src.data as { id?: unknown } | null)?.id;
    const id = typeof rawId === 'string' ? rawId : undefined;
    const result = schema.safeParse(src.data);
    if (!result.success) {
      if (id) invalidIds.add(id);
      for (const issue of result.error.issues) {
        const at = issue.path.length ? `${issue.path.join('.')}: ` : '';
        findings.push({
          rule: 'schema',
          file,
          line: src.lineOf(issue.path),
          id,
          message: `${at}${issue.message}`,
        });
      }
      return undefined;
    }
    return {
      id: id ?? '',
      data: result.data as T,
      file,
      line,
      lineOf: (p) => src.lineOf(p),
    };
  };

  for (const raw of files) {
    const path = raw.path;
    if (path.startsWith('modules/')) {
      const dir = path.split('/')[1];
      if (dir && path.split('/').length > 2) model.moduleDirs.add(dir);
    }
    if (isIgnored(path)) continue;
    const file = classify(raw);
    model.files.push(file);
    if (!file.type) {
      findings.push({
        rule: 'unrecognized-file',
        file: path,
        line: 1,
        message: 'file is not in a known spec location',
      });
      continue;
    }
    if (file.type === 'prose') continue;

    const def = SPEC_TYPES[file.type] as DocumentType | CollectionType;
    const split = splitFrontMatter(file.content);

    if (def.kind === 'document') {
      if (split.raw === undefined) {
        findings.push({ rule: 'schema', file: path, line: 1, message: 'missing YAML front-matter' });
        continue;
      }
      const located = validate<unknown>(def.schema, new YamlSource(split.raw, 2), path, 1, 'front-matter');
      if (!located) continue;
      const doc = { ...located, body: split.body, bodyLine: split.bodyLine } as LocatedDoc<never>;
      define(doc.id, path, 1);
      const target = {
        application: undefined,
        module: model.modules,
        capability: model.capabilities,
        screen: model.screens,
        entity: model.entities,
        flow: model.flows,
        experience: model.experiences,
        change: model.changes,
      }[
        file.type as
          'application' | 'module' | 'capability' | 'screen' | 'entity' | 'flow' | 'experience' | 'change'
      ];
      if (file.type === 'application') model.application = doc;
      else if (target && !target.has(doc.id)) target.set(doc.id, doc);
      continue;
    }

    // collection
    for (const item of parseCollection(split.body)) {
      const line = split.bodyLine - 1 + item.line;
      if (item.yamlSource === undefined || item.yamlLine === undefined) {
        findings.push({
          rule: 'schema',
          file: path,
          line,
          message: `item "${item.heading}" has no yaml block`,
        });
        continue;
      }
      const schema = itemSchemaFor(def, item.heading);
      if (!schema) {
        findings.push({
          rule: 'schema',
          file: path,
          line,
          message: `item "${item.heading}" does not belong in this file (expected ${Object.keys(def.items).join(' or ')} items)`,
        });
        continue;
      }
      const src = new YamlSource(item.yamlSource, split.bodyLine - 1 + item.yamlLine);
      const located = validate<never>(schema, src, path, line, `item "${item.heading}"`);
      if (!located) continue;
      const withHeading = { ...located, heading: item.heading };
      if (file.type === 'glossary') {
        model.glossary.push(withHeading as never);
        continue;
      }
      define(located.id, path, line);
      const prefix = located.id.split('-')[0];
      const map = {
        PER: model.personas,
        ROLE: model.roles,
        RULE: model.rules,
        EVT: model.events,
        DEC: model.decisions,
      }[prefix as 'PER'] as Map<string, Located<unknown>> | undefined;
      if (map && !map.has(located.id)) map.set(located.id, withHeading);
    }
  }

  return { model, findings, invalidIds };
}
