import type { Bundle } from '../bundle.js';
import { lifecycle, sourceComment, type TargetContext, type TargetOutput } from './common.js';

export function renderBundle(b: Bundle, ctx: TargetContext): TargetOutput {
  const out: string[] = [
    `# ${b.scope.id} — ${b.scope.title}`,
    '',
    sourceComment(b, ctx),
    '',
    `Self-contained product specification exported from alterspec on ${ctx.date}. It describes what the product does and why, in business terms; technical design decisions are made from here on.`,
    '',
    `**Application:** ${b.application.title}  `,
    `**Module:** ${b.module.id} — ${b.module.title}`,
    '',
    b.module.description,
    '',
  ];

  for (const c of b.capabilities) {
    const t = c.text;
    out.push(`## ${c.id} — ${c.title}`, '', `Status: ${c.status}, version ${c.version}.`, '');
    if (t.userStory.raw) out.push(`> ${t.userStory.raw}`, '');
    const show = (heading: string, label = heading) => {
      const text = t.sections[heading];
      if (text) out.push(`### ${label}`, '', text, '');
    };
    show('Business value / problem', 'Business value');
    show('Preconditions and triggers');
    out.push(
      '### Roles and permissions',
      '',
      ...c.roles.map((r) => `- ${r.role} (${r.title}): ${r.scope} scope`),
      '',
    );
    show('Permissions and data visibility', 'Data visibility');
    show('Main flow');
    show('Alternative and exception flows');
    show('Data in / data out');
    show('Business rules applied');
    show('State transitions caused');
    show('Notifications');
    if (t.acceptance.length) {
      out.push('### Acceptance criteria', '');
      for (const ac of t.acceptance) {
        out.push(`- **${ac.id}**`);
        for (const g of ac.given) out.push(`  - Given ${g}`);
        for (const w of ac.when) out.push(`  - When ${w}`);
        for (const th of ac.then) out.push(`  - Then ${th}`);
        for (const a of ac.and) out.push(`  - And ${a}`);
        if (ac.covers) out.push(`  - Covers: ${ac.covers}`);
      }
      out.push('');
    }
    show('Out of scope');
    if (c.dependsOn.length) out.push(`Depends on: ${c.dependsOn.join(', ')}.`, '');
  }

  if (b.flows.length) {
    out.push('## Flows', '');
    for (const f of b.flows) {
      out.push(`### ${f.id} — ${f.title}`, '');
      for (const s of f.steps)
        out.push(
          `${s.step}. ${s.inScope ? '**' : ''}${s.capability} ${s.title}${s.inScope ? '**' : ''}${s.role ? ` (${s.role})` : ''}`,
        );
      out.push('');
    }
  }
  if (b.entities.length) {
    out.push('## Business entities', '');
    for (const e of b.entities) {
      out.push(`### ${e.id} — ${e.title}`, '', e.description, '');
      if (e.attributes.length) {
        out.push('| Attribute | Kind | Required | Description |', '| --- | --- | --- | --- |');
        for (const a of e.attributes)
          out.push(`| ${a.name} | ${a.kind} | ${a.required ? 'yes' : 'no'} | ${a.description ?? ''} |`);
        out.push('');
      }
      out.push(`Lifecycle: ${lifecycle(e)}${e.initialState ? ` (starts as ${e.initialState})` : ''}.`, '');
      if (e.relationships.length)
        out.push(
          `Relationships: ${e.relationships.map((r) => `${r.cardinality} ${r.entity}`).join(', ')}.`,
          '',
        );
    }
  }
  if (b.rules.length)
    out.push('## Business rules', '', ...b.rules.map((r) => `- **${r.id} ${r.title}:** ${r.statement}`), '');
  if (b.events.length)
    out.push(
      '## Business events',
      '',
      ...b.events.map((e) => `- **${e.id} ${e.title}**${e.external ? ' (external)' : ''}: ${e.description}`),
      '',
    );
  if (b.screens.length) {
    out.push('## Screens', '');
    for (const s of b.screens) {
      out.push(`### ${s.id} — ${s.title}`, '', s.purpose, '');
      for (const f of s.fields)
        out.push(`- Shows ${f.entity} ${f.entityTitle} (${f.mode}): ${f.attributes.join(', ')}`);
      for (const a of s.actions) out.push(`- ${a.id} ${a.label} → ${a.capability}`);
      for (const m of s.mockups) out.push(`- Mockup (${m.type}): ${m.ref}`);
      if (s.fields.length || s.actions.length || s.mockups.length) out.push('');
    }
    out.push('A clickable prototype of these screens, with made-up data, is in `prototype/index.html`.', '');
  }
  if (b.roles.length)
    out.push(
      '## Roles',
      '',
      ...b.roles.map(
        (r) =>
          `- **${r.id} ${r.title}:** ${r.description}${r.personas.length ? ` Held by ${r.personas.join(', ')}.` : ''}`,
      ),
      '',
    );
  if (b.personas.length)
    out.push(
      '## Personas',
      '',
      ...b.personas.map((p) => `- **${p.id} ${p.title}:** ${p.description.replace(/\n+/g, ' ')}`),
      '',
    );
  if (b.glossary.length) {
    out.push(
      '## Glossary',
      '',
      ...b.glossary.map(
        (g) =>
          `- **${g.term}:** ${g.definition}${g.forbidden.length ? ` (not: ${g.forbidden.join(', ')})` : ''}`,
      ),
      '',
    );
  }
  out.push('## Open questions', '');
  const open = [
    ...b.openQuestions.map(
      (q) => `- ${q.id} ${q.title}${q.context ? ` — ${q.context.replace(/\n+/g, ' ')}` : ''}`,
    ),
    ...b.capabilities.flatMap((c) => c.text.openQuestions.map((q) => `- ${c.id}: ${q}`)),
  ];
  out.push(...(open.length ? open : ['None.']), '');

  return new Map([
    ['README.md', out.join('\n').replace(/\n{3,}/g, '\n\n')],
    ['bundle.json', JSON.stringify(b, null, 2) + '\n'],
  ]);
}
