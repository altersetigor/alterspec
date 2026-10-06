import type { Bundle } from '../bundle.js';
import { slug } from '../bundle.js';
import {
  acLine,
  goalOf,
  join,
  lowerFirst,
  rolesOf,
  rulesOf,
  sentence,
  sourceComment,
  valueOf,
  type TargetContext,
  type TargetOutput,
} from './common.js';

const clamp = (text: string, min: number, max: number, pad: string) => {
  let t = text.replace(/\s+/g, ' ').trim();
  if (t.length < min) t = `${t} ${pad}`.trim();
  if (t.length > max) t = t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  return t;
};

export const openspecChangeId = (b: Bundle) => `add-${slug(b.scope.title)}`;

export function renderOpenspec(b: Bundle, ctx: TargetContext): TargetOutput {
  const capability = slug(b.module.title);
  const files: TargetOutput = new Map();
  const why = clamp(
    b.capabilities
      .map((c) => valueOf(c))
      .filter(Boolean)
      .join(' ') || b.module.description,
    50,
    1000,
    `This change implements ${b.scope.title} as specified in the product specification (${b.scope.id}).`,
  );
  const impact = [
    `- Roles: ${join(b.roles.map((r) => `${r.title} (${r.id})`))}`,
    ...(b.entities.length ? [`- Business entities: ${join(b.entities.map((e) => e.title))}`] : []),
    ...b.flows.map((f) => {
      const steps = f.steps.filter((s) => s.inScope).map((s) => s.step);
      return `- Flow ${f.id} ${f.title}: step${steps.length > 1 ? 's' : ''} ${steps.join(', ')}`;
    }),
    ...(b.openQuestions.length
      ? [`- Open questions: ${b.openQuestions.map((q) => `${q.id} ${q.title}`).join('; ')}`]
      : []),
  ];
  files.set(
    'proposal.md',
    [
      '# Proposal',
      '',
      sourceComment(b, ctx),
      '',
      '## Why',
      '',
      why,
      '',
      '## What Changes',
      '',
      ...b.capabilities.map(
        (c) => `- ${c.title}: ${sentence(c.text.userStory.raw || `${rolesOf(c)} can ${goalOf(c)}`)}`,
      ),
      '',
      '## Capabilities',
      '',
      '### New Capabilities',
      '',
      `- \`${capability}\`: ${sentence(b.module.title + (b.module.description ? ` — ${b.module.description}` : ''))}`,
      '',
      '### Modified Capabilities',
      '',
      '- None.',
      '',
      '## Impact',
      '',
      ...impact,
      '',
    ].join('\n'),
  );
  files.set(
    'tasks.md',
    [
      '# Tasks',
      '',
      ...b.capabilities.flatMap((c, i) => [
        `## ${i + 1}. ${c.title} (${c.id})`,
        '',
        `- [ ] ${i + 1}.1 Implement the main flow`,
        ...(c.text.exceptions.length
          ? [`- [ ] ${i + 1}.2 Implement the alternative and exception flows`]
          : []),
        `- [ ] ${i + 1}.${c.text.exceptions.length ? 3 : 2} Verify the scenarios ${join(c.text.acceptance.map((a) => a.id)) || 'of the main flow'}`,
        '',
      ]),
    ].join('\n'),
  );

  const spec: string[] = [
    '## Purpose',
    '',
    clamp(
      b.module.description,
      50,
      2000,
      `This capability covers ${b.module.title} as specified in the product specification (${b.module.id}).`,
    ),
    '',
    '## ADDED Requirements',
    '',
  ];
  for (const c of b.capabilities) {
    const rules = rulesOf(b, c).map((r) => ` It MUST enforce ${r.id} "${r.title}": ${sentence(r.statement)}`);
    spec.push(`### Requirement: ${c.title}`, '');
    spec.push(
      `The system SHALL let ${rolesOf(c)} ${lowerFirst(goalOf(c)).replace(/\.$/, '')}.${rules.join('')}`,
      '',
    );
    spec.push(`<!-- alterspec: ${c.id} v${c.version} -->`, '');
    const scenarios = c.text.acceptance.length
      ? c.text.acceptance.map((ac) => {
          const l = acLine(ac);
          return [
            `#### Scenario: ${ac.id}`,
            '',
            `- **WHEN** ${l.when}${l.given ? `, given ${l.given}` : ''}`,
            `- **THEN** ${l.then}`,
            ...l.and.map((a) => `- **AND** ${a}`),
            '',
          ];
        })
      : [
          [
            `#### Scenario: ${c.title} main flow`,
            '',
            `- **WHEN** ${c.text.mainFlow[0] ?? 'the main flow is started'}`,
            `- **THEN** ${c.text.mainFlow[c.text.mainFlow.length - 1] ?? 'the goal is reached'}`,
            '',
          ],
        ];
    for (const s of scenarios) spec.push(...s);
  }
  files.set(`specs/${capability}/spec.md`, spec.join('\n'));
  return files;
}
