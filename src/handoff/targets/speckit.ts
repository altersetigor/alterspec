import type { Bundle } from '../bundle.js';
import {
  acLine,
  goalOf,
  join,
  lifecycle,
  lowerFirst,
  rolesOf,
  rulesOf,
  sentence,
  sourceComment,
  valueOf,
  type TargetContext,
  type TargetOutput,
} from './common.js';

export function renderSpeckit(b: Bundle, ctx: TargetContext, folder: string): TargetOutput {
  const out: string[] = [
    `# Feature Specification: ${b.scope.title}`,
    '',
    `**Feature Branch**: \`${folder}\`  `,
    `**Created**: ${ctx.date}  `,
    '**Status**: Draft  ',
    `**Input**: Product specification ${b.scope.id} exported from alterspec (${b.capabilities.map((c) => `${c.id} v${c.version}`).join(', ')})`,
    '',
    sourceComment(b, ctx),
    '',
    '## User Scenarios & Testing *(mandatory)*',
    '',
  ];
  b.capabilities.forEach((c, i) => {
    const t = c.text;
    out.push(`### User Story ${i + 1} - ${c.title} (Priority: P${i + 1})`, '');
    out.push(sentence(t.userStory.raw || `${rolesOf(c)} ${goalOf(c)}`), '');
    out.push(
      `**Why this priority**: ${sentence(valueOf(c).replace(/\s+/g, ' ') || `Needed for ${b.module.title}`)}${i > 0 && c.dependsOn.length ? ` Builds on ${join(c.dependsOn)}.` : ''}`,
      '',
    );
    const steps = t.mainFlow.length
      ? ` by completing the main flow: ${t.mainFlow.map((s) => s.replace(/\.$/, '')).join('; ')}`
      : '';
    out.push(`**Independent Test**: Can be fully tested${steps}.`, '');
    out.push('**Acceptance Scenarios**:', '');
    t.acceptance.forEach((ac, j) => {
      const l = acLine(ac);
      const then = [l.then, ...l.and].filter(Boolean).join(', and ');
      out.push(
        `${j + 1}. **Given** ${l.given || 'the preconditions hold'}, **When** ${l.when}, **Then** ${then} *(${ac.id})*`,
      );
    });
    if (!t.acceptance.length) out.push('1. [NEEDS CLARIFICATION: no acceptance criteria yet]');
    out.push('', '---', '');
  });
  const edge = b.capabilities.flatMap((c) => c.text.exceptions.map((e) => `- ${sentence(e)} *(${c.id})*`));
  out.push(
    '### Edge Cases',
    '',
    ...(edge.length ? edge : ['- None identified in the product specification.']),
    '',
  );

  const fr: string[] = [];
  for (const c of b.capabilities) {
    const scopes = c.roles.map((r) => `${lowerFirst(r.title)} (${r.scope} scope)`);
    fr.push(
      `System MUST allow the ${join(scopes)} to ${lowerFirst(goalOf(c)).replace(/\.$/, '')}. *(${c.id})*`,
    );
    for (const r of rulesOf(b, c)) {
      const line = `System MUST enforce ${r.id} ${r.title}: ${sentence(r.statement)} *(${r.id})*`;
      if (!fr.includes(line)) fr.push(line);
    }
    for (const e of c.entities) {
      for (const tr of e.transitions) {
        const [from, to] = tr.split('->');
        const entity = b.entities.find((x) => x.id === e.entity)?.title ?? e.entity;
        fr.push(
          `System MUST move the ${entity.toLowerCase()} from ${from} to ${to} when "${c.title}" is completed. *(${c.id})*`,
        );
      }
    }
  }
  for (const q of [
    ...b.openQuestions.map((q) => q.title),
    ...b.capabilities.flatMap((c) => c.text.openQuestions),
  ]) {
    fr.push(`System MUST behave as decided for: [NEEDS CLARIFICATION: ${q.replace(/\.$/, '')}]`);
  }
  out.push('## Requirements *(mandatory)*', '', '### Functional Requirements', '');
  fr.forEach((f, i) => out.push(`- **FR-${String(i + 1).padStart(3, '0')}**: ${f}`));
  out.push('', '### Key Entities *(include if feature involves data)*', '');
  for (const e of b.entities) {
    const attrs = e.attributes.map((a) => `${a.name}${a.required ? '' : ' (optional)'}`);
    out.push(
      `- **${e.title}**: ${sentence(e.description)}${attrs.length ? ` Attributes: ${attrs.join(', ')}.` : ''} Lifecycle: ${lifecycle(e)}.`,
    );
  }
  if (!b.entities.length) out.push('- None.');

  out.push('', '## Success Criteria *(mandatory)*', '', '### Measurable Outcomes', '');
  b.capabilities.forEach((c, i) => {
    out.push(
      `- **SC-${String(i + 1).padStart(3, '0')}**: All ${c.text.acceptance.length} acceptance scenario(s) of "${c.title}" pass${c.text.userStory.benefit ? `, so that ${c.text.userStory.benefit.replace(/\.$/, '')}` : ''}.`,
    );
  });

  out.push('', '## Assumptions', '');
  const assumptions = [
    ...b.capabilities.flatMap((c) =>
      c.text.outOfScope.map((o) => `- Out of scope: ${sentence(o)} *(${c.id})*`),
    ),
    ...b.capabilities.flatMap((c) => c.dependsOn.map((d) => `- ${d} is available before ${c.id}.`)),
    `- Roles and permission scopes follow the alterspec product specification (${join(b.roles.map((r) => r.id))}).`,
  ];
  out.push(...assumptions, '');
  return new Map([['spec.md', out.join('\n')]]);
}
