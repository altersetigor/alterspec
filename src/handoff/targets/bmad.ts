import type { Bundle } from '../bundle.js';
import {
  goalOf,
  lowerFirst,
  rolesOf,
  rulesOf,
  sentence,
  type TargetContext,
  type TargetOutput,
} from './common.js';

export function renderBmad(b: Bundle, ctx: TargetContext): TargetOutput {
  const fr: { text: string; story: number }[] = [];
  b.capabilities.forEach((c, i) => {
    fr.push({
      text: `${rolesOf(c)} can ${lowerFirst(goalOf(c)).replace(/\.$/, '')}. (${c.id})`,
      story: i + 1,
    });
  });
  const out: string[] = [
    '---',
    'status: draft',
    `inputDocuments: [${b.capabilities.map((c) => `"alterspec ${c.id} v${c.version}"`).join(', ')}]`,
    `exportedBy: "alterspec ${ctx.version}"`,
    '---',
    '',
    `# ${b.application.title} - Epic Breakdown`,
    '',
    '## Overview',
    '',
    `This document breaks ${b.scope.id} (${b.scope.title}) from the alterspec product specification into an epic and stories. Edit the source spec, not this file.`,
    '',
    '## Requirements Inventory',
    '',
    '### Functional Requirements',
    '',
    ...fr.map((f, i) => `FR${i + 1}: ${f.text}`),
    '',
    '### NonFunctional Requirements',
    '',
    'None in this export.',
    '',
    '### Additional Requirements',
    '',
    ...(b.rules.length ? b.rules.map((r) => `- ${r.id} ${r.title}: ${sentence(r.statement)}`) : ['None.']),
    '',
    '### UX Design Requirements',
    '',
    ...(b.screens.length
      ? b.screens.map(
          (s) =>
            `- ${s.id} ${s.title}: ${sentence(s.purpose)}${s.fields.map((f) => ` Shows ${f.entityTitle} (${f.mode}): ${f.attributes.join(', ')}.`).join('')}${s.actions.length ? ` Actions: ${s.actions.map((a) => a.label).join(', ')}.` : ''}`,
        )
      : ['None.']),
    '',
    '### FR Coverage Map',
    '',
    ...fr.map((f, i) => `FR${i + 1}: Epic 1 - Story 1.${f.story}`),
    '',
    '## Epic List',
    '',
    `## Epic 1: ${b.module.title}`,
    '',
    b.module.description,
    '',
  ];
  b.capabilities.forEach((c, i) => {
    const us = c.text.userStory;
    out.push(`### Story 1.${i + 1}: ${c.title}`, '', `<!-- alterspec: ${c.id} v${c.version} -->`, '');
    out.push(
      `As a ${us.persona ?? c.roles[0]?.title ?? 'user'},`,
      `I want to ${us.goal ?? lowerFirst(c.title)},`,
      `So that ${(us.benefit ?? 'the business goal is met').replace(/\.$/, '')}.`,
      '',
    );
    out.push('**Acceptance Criteria:**', '');
    for (const ac of c.text.acceptance) {
      out.push(`<!-- ${ac.id} -->`);
      ac.given.forEach((g, j) => out.push(`**${j ? 'And' : 'Given'}** ${g}`));
      ac.when.forEach((w, j) => out.push(`**${j ? 'And' : 'When'}** ${w}`));
      ac.then.forEach((t, j) => out.push(`**${j ? 'And' : 'Then'}** ${t}`));
      ac.and.forEach((a) => out.push(`**And** ${a}`));
      out.push('');
    }
    for (const r of rulesOf(b, c)) out.push(`Business rule ${r.id}: ${sentence(r.statement)}`, '');
  });
  return new Map([['epics.md', out.join('\n')]]);
}
