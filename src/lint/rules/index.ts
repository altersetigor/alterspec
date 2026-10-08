import type { LintRule } from '../types.js';
import {
  acceptanceIds,
  capabilityWithoutFlow,
  eventConsumedWithoutEmitter,
  eventEmittedNotConsumed,
  flowBacklink,
  foreignModuleRule,
  invalidTransition,
  lifecycleCoverage,
  orphanEntity,
  orphanScreen,
  screenBacklink,
  transitionCoverage,
} from './coverage.js';
import { directEdit } from './baseline.js';
import { incompleteSection } from './completeness.js';
import { generatedEdited, generatedMissing, viewsStale } from './generated.js';
import { duplicateId, idLocation, moduleRegistry, placeholder, unknownReference } from './structure.js';
import {
  entityAttributeDetail,
  screenFieldAttribute,
  screenFieldOp,
  screenFieldsMissing,
  screenRoleAction,
} from './screens.js';
import {
  experienceChrome,
  experienceElements,
  experienceLabels,
  experienceMissing,
  experienceMockup,
  experienceStale,
  experienceStates,
  experienceUnreviewed,
  experienceVocabulary,
} from './experience.js';
import { glossaryForbidden, techLeak } from './text.js';

/** Findings for these rules come from the loader, not from a check. */
const loaderRule = (name: string, severity: LintRule['severity'], description: string): LintRule => ({
  name,
  severity,
  description,
  check: () => [],
});

export const RULES: LintRule[] = [
  loaderRule('yaml-syntax', 'error', 'Front-matter and item yaml blocks are valid YAML.'),
  loaderRule('schema', 'error', 'Front-matter and items match their schema.'),
  loaderRule('unrecognized-file', 'warn', 'Every markdown file under spec/ is in a known location.'),
  duplicateId,
  idLocation,
  unknownReference,
  moduleRegistry,
  invalidTransition,
  transitionCoverage,
  lifecycleCoverage,
  orphanScreen,
  orphanEntity,
  eventConsumedWithoutEmitter,
  eventEmittedNotConsumed,
  capabilityWithoutFlow,
  flowBacklink,
  screenBacklink,
  screenFieldAttribute,
  screenFieldOp,
  screenRoleAction,
  screenFieldsMissing,
  entityAttributeDetail,
  experienceElements,
  experienceMockup,
  experienceLabels,
  experienceStates,
  experienceVocabulary,
  experienceChrome,
  experienceStale,
  experienceMissing,
  experienceUnreviewed,
  foreignModuleRule,
  acceptanceIds,
  incompleteSection,
  placeholder,
  generatedEdited,
  generatedMissing,
  viewsStale,
  glossaryForbidden,
  techLeak,
  directEdit,
];
