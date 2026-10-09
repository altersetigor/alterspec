import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadChange } from '../changes/change.js';
import { parseFrontMatter } from '../lib/frontmatter.js';
import { lineOfKey, setPath } from '../lib/frontmatter-edit.js';
import {
  ApplicationSchema,
  Tenancy,
  TenantData,
  TimeZones,
  type Application,
  type Profile,
} from '../schemas/index.js';
import { changeEdit } from './change.js';

export interface ProfileOptions {
  spec?: string;
  /** Edit the application inside this change proposal. */
  change?: string;
  tenancy?: string;
  tenantData?: string;
  languages?: string;
  defaultLanguage?: string;
  localisedContent?: boolean;
  currencies?: string;
  defaultCurrency?: string;
  timeZones?: string;
  timeZone?: string;
}

export interface ProfileResult {
  /** Path relative to the project root. */
  file: string;
  line: number;
  profile: Profile;
}

class ProfileError extends Error {}

const APP_FILE = 'application/application.md';
const csv = (s: string | undefined) =>
  s === undefined
    ? undefined
    : s
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

function readApplication(file: string): { data: Record<string, unknown>; profile: Partial<Profile> } {
  if (!existsSync(file)) throw new ProfileError(`${APP_FILE} is missing; run \`alterspec init\` first`);
  const { data, hasFrontMatter } = parseFrontMatter(readFileSync(file, 'utf8'));
  if (!hasFrontMatter || typeof data !== 'object' || data === null)
    throw new ProfileError(`${APP_FILE} has no front-matter`);
  const record = data as Record<string, unknown>;
  const profile = (record.profile ?? {}) as Partial<Profile>;
  return { data: record, profile };
}

/** The application file to edit and the one to read the current profile from. */
function locate(dir: string, opts: ProfileOptions) {
  const root = resolve(dir);
  const specDir = opts.spec ?? 'spec';
  const specRoot = join(root, specDir);
  if (!opts.change) return { file: join(specRoot, APP_FILE), rel: `${specDir}/${APP_FILE}`, touch: () => {} };
  const change = loadChange(specRoot, opts.change);
  return {
    file: join(change.overlayRoot, APP_FILE),
    rel: `${specDir}/changes/${change.id}/spec/${APP_FILE}`,
    touch: () => changeEdit(specRoot, change.id, 'APP'),
  };
}

/** The current profile, from the spec or a change's overlay. */
export function runProfileShow(dir: string, opts: ProfileOptions = {}): ProfileResult | undefined {
  const { file, rel } = locate(dir, opts);
  const { data } = readApplication(
    existsSync(file) ? file : join(resolve(dir), opts.spec ?? 'spec', APP_FILE),
  );
  const parsed = ApplicationSchema.safeParse(data);
  if (!parsed.success) throw new ProfileError(`${rel}: ${issues(parsed.error)}`);
  return parsed.data.profile && { file: rel, line: lineOfKey(file, 'profile'), profile: parsed.data.profile };
}

/** Merge the given flags into the profile; refused when the result would not validate (e.g. no default). */
export function runProfileSet(dir: string, opts: ProfileOptions): ProfileResult {
  const { file, rel, touch } = locate(dir, opts);
  touch();
  const { data, profile } = readApplication(file);
  const next: Partial<Profile> = { ...profile };
  const enumOf = <T extends string>(options: readonly T[], v: string | undefined, flag: string) => {
    if (v === undefined) return undefined;
    if (!options.includes(v as T)) throw new ProfileError(`${flag} must be one of ${options.join(', ')}`);
    return v as T;
  };
  const set = <K extends keyof Profile>(key: K, value: Profile[K] | undefined) => {
    if (value !== undefined) next[key] = value;
  };
  set('tenancy', enumOf(Tenancy.options, opts.tenancy, '--tenancy'));
  set('tenant_data', enumOf(TenantData.options, opts.tenantData, '--tenant-data'));
  set('languages', csv(opts.languages));
  set('default_language', opts.defaultLanguage?.trim());
  set('localised_content', opts.localisedContent);
  set('currencies', csv(opts.currencies));
  set('default_currency', opts.defaultCurrency?.trim());
  set('time_zones', enumOf(TimeZones.options, opts.timeZones, '--time-zones'));
  set('time_zone', opts.timeZone?.trim());
  // A single value needs no default; drop a stale one so the file stays minimal.
  if (next.languages?.length === 1 && next.default_language === next.languages[0])
    delete next.default_language;
  if (next.currencies?.length === 1 && next.default_currency === next.currencies[0])
    delete next.default_currency;
  if (next.tenancy === 'single') delete next.tenant_data;

  for (const [key, flag] of [
    ['tenancy', '--tenancy'],
    ['languages', '--languages'],
    ['currencies', '--currencies'],
    ['time_zones', '--time-zones'],
  ] as const) {
    if (next[key] === undefined) throw new ProfileError(`the profile needs ${flag}`);
  }
  const parsed = ApplicationSchema.safeParse({ ...data, profile: next });
  if (!parsed.success) throw new ProfileError(`profile refused: ${issues(parsed.error)}`);
  const app: Application = parsed.data;
  setPath(file, ['profile'], app.profile);
  return { file: rel, line: lineOfKey(file, 'profile'), profile: app.profile! };
}

const issues = (e: { issues: { path: PropertyKey[]; message: string }[] }) =>
  e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');

export function formatProfile(p: Profile): string {
  const lines = [
    `tenancy: ${p.tenancy}${p.tenant_data ? ` (tenant data ${p.tenant_data})` : ''}`,
    `languages: ${p.languages.join(', ')}${p.default_language ? ` (default ${p.default_language})` : ''}${
      p.localised_content ? ', content is translated' : ''
    }`,
    `currencies: ${p.currencies.join(', ')}${p.default_currency ? ` (default ${p.default_currency})` : ''}`,
    `time zones: ${p.time_zones}${p.time_zone ? ` (${p.time_zone})` : ''}`,
  ];
  return lines.join('\n');
}

export { ProfileError };
