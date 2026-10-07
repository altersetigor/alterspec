import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { asset } from '../prototype/index.js';
import {
  BUILT_VARIANTS,
  DESIGN_DIR,
  DesignError,
  VARIANTS_DIR,
  VARIANT_FILE,
  buildVariant,
  checkVariant,
  isBuiltVariant,
  listVariants,
  readDesign,
  stampFor,
  type VariantFinding,
} from '../prototype/variant.js';
import { DesignBase } from '../schemas/design.js';
import { readSpecDir } from '../spec/files.js';
import { loadSpec } from '../spec/load.js';

const loadModel = (root: string, spec = 'spec') => loadSpec(readSpecDir(join(root, spec))).model;

export interface PrototypeInitResult {
  created: string[];
  skipped: string[];
}

/** Write a starter design/ folder. Never overwrites. */
export function runPrototypeInit(dir: string, opts: { base?: string } = {}): PrototypeInitResult {
  const root = resolve(dir);
  const base = opts.base ?? 'bootstrap';
  if (!DesignBase.safeParse(base).success)
    throw new DesignError(`unknown base ${base}; use one of ${DesignBase.options.join(', ')}`);
  const result: PrototypeInitResult = { created: [], skipped: [] };
  const files: [string, string][] = [
    ['design.yaml', asset('design/design.yaml').replace('{{base}}', base)],
    ['tokens.css', asset('design/tokens.css')],
  ];
  for (const [name, content] of files) {
    const rel = `${DESIGN_DIR}/${name}`;
    const full = join(root, rel);
    if (existsSync(full)) result.skipped.push(rel);
    else {
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
      result.created.push(rel);
    }
  }
  return result;
}

export interface PrototypeBuildResult {
  variant: string;
  folder: string;
  files: string[];
}

/** Render a variant into prototype/<variant>/, replacing what was there. */
export function runPrototypeBuild(
  dir: string,
  opts: { spec?: string; variant?: string } = {},
): PrototypeBuildResult {
  const root = resolve(dir);
  const design = readDesign(root);
  if (!design)
    throw new DesignError(
      `no ${DESIGN_DIR}/design.yaml; run \`alterspec prototype init\` or /alterspec-prototype`,
    );
  const variant = opts.variant ?? design.base;
  if (!isBuiltVariant(variant)) {
    throw new DesignError(
      variant === 'custom'
        ? 'custom variants are written with Claude (/alterspec-prototype), then checked with `prototype check --stamp`'
        : `unknown variant ${variant}; use one of ${BUILT_VARIANTS.join(', ')}`,
    );
  }
  const files = buildVariant(loadModel(root, opts.spec), root, design, variant);
  const folder = `${VARIANTS_DIR}/${variant}`;
  rmSync(join(root, folder), { recursive: true, force: true });
  for (const [path, content] of files) {
    const full = join(root, folder, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return { variant, folder, files: [...files.keys()].sort() };
}

export interface PrototypeCheckResult {
  variants: string[];
  findings: VariantFinding[];
  stamped: string[];
}

/** Check variants against the current spec; with `stamp`, record the current manifest in variants that pass. */
export function runPrototypeCheck(
  dir: string,
  opts: { spec?: string; variant?: string; stamp?: boolean } = {},
): PrototypeCheckResult {
  const root = resolve(dir);
  const model = loadModel(root, opts.spec);
  const variants = opts.variant ? [opts.variant] : listVariants(root);
  const findings: VariantFinding[] = [];
  const stamped: string[] = [];
  for (const v of variants) {
    if (!existsSync(join(root, VARIANTS_DIR, v))) throw new DesignError(`no variant ${VARIANTS_DIR}/${v}/`);
    let f = checkVariant(model, root, v);
    if (opts.stamp && f.every((x) => x.kind === 'stale' || x.kind === 'unstamped')) {
      writeFileSync(
        join(root, VARIANTS_DIR, v, VARIANT_FILE),
        JSON.stringify(stampFor(model, v), null, 2) + '\n',
      );
      stamped.push(v);
      f = [];
    }
    findings.push(...f);
  }
  return { variants, findings, stamped };
}
