import { join, resolve } from 'node:path';
import { ChangeError, loadChange } from '../changes/change.js';
import { computeImpact, mergedFiles } from '../changes/impact.js';
import { overlayObjects } from '../changes/merge.js';
import { hasExperience } from '../experience/index.js';
import { loadSpec } from '../spec/load.js';
import { runChangeRemove, type ChangeOptions } from './change.js';
import { runExperienceNew, runExperienceSync, type ExperienceSyncResult } from './experience.js';

export interface ChangeSyncResult {
  id: string;
  /** Stale experience screens re-aligned inside the change (copied into it when they weren't there yet). */
  synced: ExperienceSyncResult[];
  /** Screens the change adds or modifies that got their first experience screen and page, as drafts to place. */
  drafted: string[];
  /** Experience screens of screens the change removes, now recorded as removed (with their pages). */
  removed: string[];
  /** Experience screens in the change that still need a parity review. */
  toReview: string[];
  skipped?: 'no experience layer';
}

/**
 * Make the experience layer follow a change in one go: re-sync every experience screen whose business screen
 * changed (inside or outside the change), draft an experience for every screen the change adds or modifies that
 * has none, and record the removal of the experience of every screen the change removes. Pages a person designed
 * are only edited the way `experience sync` edits them; nothing is rendered over them.
 */
export function runChangeSync(dir: string, changeId: string, opts: ChangeOptions = {}): ChangeSyncResult {
  const root = resolve(dir);
  const specRoot = join(root, opts.spec ?? 'spec');
  const change = loadChange(specRoot, changeId);
  if (change.proposal.status !== 'draft' && change.proposal.status !== 'in_review')
    throw new ChangeError(`${change.id} is ${change.proposal.status} and can't be edited`);
  const { merged } = mergedFiles(specRoot, change.id, root);
  if (!hasExperience(loadSpec(merged).model))
    return {
      id: change.id,
      synced: [],
      drafted: [],
      removed: [],
      toReview: [],
      skipped: 'no experience layer',
    };

  const impact = computeImpact(root, change.id, opts);
  const xo = { ...opts, change: change.id };
  const synced = impact.experience.stale.map((screen) => runExperienceSync(dir, screen, xo));
  const drafted = impact.experience.missing.map((screen) => runExperienceNew(dir, screen, xo).screen);
  const removed = impact.experience.orphaned.map((ux) => runChangeRemove(dir, change.id, ux, opts).key);

  const after = computeImpact(root, change.id, opts);
  const inOverlay = overlayObjects(loadChange(specRoot, change.id));
  const toReview = after.experience.unreviewed.filter((ux) => inOverlay.has(ux));
  return { id: change.id, synced, drafted, removed, toReview };
}
