import { posix } from 'node:path';
import type { Capability } from '../schemas/index.js';
import { acceptanceCriteria } from '../spec/acceptance.js';
import type { LocatedDoc, SpecModel } from '../spec/model.js';

const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const sorted = <T extends { id: string }>(m: Map<string, T>) => [...m.values()].sort(byId);
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const link = (from: string, to: string, text: string) =>
  `[${text}](${posix.relative(posix.dirname(from), to) || posix.basename(to)})`;

function table(head: string[], rows: string[][]): string {
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n');
}

const OPS = ['C', 'R', 'U', 'D', 'A'] as const;

type Cap = LocatedDoc<Capability>;

export function capsOfModule(model: SpecModel, moduleId: string): Cap[] {
  return sorted(model.capabilities).filter((c) => c.data.module === moduleId);
}

export function capsUsingEntity(model: SpecModel, entityId: string): Cap[] {
  return sorted(model.capabilities).filter((c) => c.data.entities.some((e) => e.entity === entityId));
}

/** Lifecycle gaps of an entity: missing operations and transitions no capability performs. */
export function entityGaps(
  model: SpecModel,
  entityId: string,
): { missingOps: string[]; uncovered: string[] } {
  const entity = model.entities.get(entityId);
  const uses = capsUsingEntity(model, entityId).flatMap((c) =>
    c.data.entities.filter((e) => e.entity === entityId),
  );
  const ops = new Set(uses.flatMap((u) => u.ops));
  const missingOps = (['C', 'R', 'U'] as const).filter((o) => !ops.has(o)).map(String);
  if (!ops.has('A') && !ops.has('D')) missingOps.push('A or D');
  const performed = new Set(uses.flatMap((u) => u.transitions));
  const uncovered = (entity?.data.transitions ?? [])
    .map((t) => `${t.from}->${t.to}`)
    .filter((t) => !performed.has(t));
  return { missingOps, uncovered };
}

// --- module.md blocks ---

export function moduleCapabilities(model: SpecModel, mod: LocatedDoc<{ id: string }>): string {
  const caps = capsOfModule(model, mod.id);
  if (caps.length === 0) return '_No capabilities yet._';
  return table(
    ['Capability', 'Title', 'Status', 'Roles'],
    caps.map((c) => [
      link(mod.file, c.file, c.id),
      c.data.title,
      c.data.status,
      c.data.roles.map((r) => `${r.role} (${r.scope})`).join(', '),
    ]),
  );
}

function roleMatrix(caps: Cap[], roles: string[], from: string): string {
  if (caps.length === 0) return '_No capabilities yet._';
  return table(
    ['Capability', ...roles],
    caps.map((c) => [
      link(from, c.file, c.id),
      ...roles.map((r) => c.data.roles.find((x) => x.role === r)?.scope ?? '—'),
    ]),
  );
}

export function moduleRoleMatrix(model: SpecModel, mod: LocatedDoc<{ id: string }>): string {
  const caps = capsOfModule(model, mod.id);
  const roles = [...new Set(caps.flatMap((c) => c.data.roles.map((r) => r.role)))].sort();
  return roleMatrix(caps, roles, mod.file);
}

export function moduleScreens(model: SpecModel, mod: LocatedDoc<{ id: string }>): string {
  const screens = sorted(model.screens).filter((s) => s.data.module === mod.id);
  if (screens.length === 0) return '_No screens yet._';
  return table(
    ['Screen', 'Title', 'Actions'],
    screens.map((s) => [
      link(mod.file, s.file, s.id),
      s.data.title,
      s.data.actions.map((a) => `${a.id} ${a.label} → ${a.capability}`).join('<br>') || '—',
    ]),
  );
}

// --- screen.md block ---

export function screenCapabilities(model: SpecModel, screenId: string): string {
  const screen = model.screens.get(screenId);
  if (!screen) return '';
  const rows = sorted(model.capabilities)
    .map((c) => {
      const via: string[] = [];
      if (c.data.screens.includes(screenId)) via.push('listed by capability');
      for (const a of screen.data.actions) if (a.capability === c.id) via.push(`action ${a.id}`);
      return { c, via };
    })
    .filter((r) => r.via.length > 0);
  if (rows.length === 0) return '_Not used by any capability yet._';
  return table(
    ['Capability', 'Title', 'Via'],
    rows.map(({ c, via }) => [link(screen.file, c.file, c.id), c.data.title, via.join(', ')]),
  );
}

// --- entity.md block ---

export function entityCoverage(model: SpecModel, entityId: string): string {
  const entity = model.entities.get(entityId);
  if (!entity) return '';
  const caps = capsUsingEntity(model, entityId);
  if (caps.length === 0) return '_Not used by any capability yet._';
  const rows = caps.map((c) => {
    const uses = c.data.entities.filter((e) => e.entity === entityId);
    const ops = new Set(uses.flatMap((u) => u.ops));
    return [
      link(entity.file, c.file, c.id),
      ...OPS.map((o) => (ops.has(o) ? '✓' : '')),
      uses.flatMap((u) => u.transitions).join(', ') || '—',
    ];
  });
  const { missingOps, uncovered } = entityGaps(model, entityId);
  const gaps: string[] = [];
  if (missingOps.length) gaps.push(`- No capability performs: ${missingOps.join(', ')}`);
  if (uncovered.length) gaps.push(`- Transitions no capability performs: ${uncovered.join(', ')}`);
  return [
    table(['Capability', ...OPS, 'Transitions'], rows),
    '',
    gaps.length ? `**Gaps**\n\n${gaps.join('\n')}` : '_No lifecycle gaps._',
  ].join('\n');
}

// --- spec/_generated/ ---

export function traceability(model: SpecModel): string {
  const from = '_generated/traceability.md';
  const out = [
    '# Traceability',
    '',
    'Flow → step → capability → screens, rules and acceptance criteria.',
    '',
  ];
  const flows = sorted(model.flows);
  if (flows.length === 0) out.push('_No flows yet._', '');
  for (const f of flows) {
    out.push(`## ${link(from, f.file, f.id)} ${cell(f.data.title)}`, '');
    out.push(
      table(
        ['Step', 'Capability', 'Role', 'Screens', 'Rules', 'Acceptance criteria'],
        f.data.steps.map((s) => {
          const c = model.capabilities.get(s.capability);
          return [
            String(s.step),
            c ? `${link(from, c.file, c.id)} ${c.data.title}` : `${s.capability} (missing)`,
            s.role ?? (c?.data.roles.map((r) => r.role).join(', ') || '—'),
            c?.data.screens.join(', ') || '—',
            c?.data.rules.join(', ') || '—',
            c
              ? acceptanceCriteria(c.body)
                  .map((a) => a.id)
                  .join(', ') || '—'
              : '—',
          ];
        }),
      ),
      '',
    );
  }
  const inFlow = new Set(flows.flatMap((f) => f.data.steps.map((s) => s.capability)));
  const without = sorted(model.capabilities).filter((c) => !inFlow.has(c.id) && c.data.flows.length === 0);
  out.push('## Capabilities without a flow', '');
  out.push(
    without.length
      ? without.map((c) => `- ${link(from, c.file, c.id)} ${c.data.title}`).join('\n')
      : '_None._',
  );
  return out.join('\n') + '\n';
}

export function coverage(model: SpecModel): string {
  const from = '_generated/coverage.md';
  const out = ['# Coverage', '', '## Entity lifecycle', ''];
  const entities = sorted(model.entities);
  out.push(
    entities.length
      ? table(
          ['Entity', ...OPS, 'Missing', 'Uncovered transitions'],
          entities.map((e) => {
            const ops = new Set(
              capsUsingEntity(model, e.id).flatMap((c) =>
                c.data.entities.filter((x) => x.entity === e.id).flatMap((x) => x.ops),
              ),
            );
            const gaps = entityGaps(model, e.id);
            return [
              link(from, e.file, e.id),
              ...OPS.map((o) => (ops.has(o) ? '✓' : '')),
              gaps.missingOps.join(', ') || '—',
              gaps.uncovered.join(', ') || '—',
            ];
          }),
        )
      : '_No entities yet._',
    '',
    '## Events',
    '',
  );
  const events = sorted(model.events);
  const caps = sorted(model.capabilities);
  out.push(
    events.length
      ? table(
          ['Event', 'Emitted by', 'Consumed by', 'External'],
          events.map((e) => [
            e.id,
            caps
              .filter((c) => c.data.events.emits.includes(e.id))
              .map((c) => c.id)
              .join(', ') || '—',
            caps
              .filter((c) => c.data.events.consumes.includes(e.id))
              .map((c) => c.id)
              .join(', ') || '—',
            e.data.external ? 'yes' : 'no',
          ]),
        )
      : '_No events yet._',
  );
  return out.join('\n') + '\n';
}

export function appRoleMatrix(model: SpecModel): string {
  const caps = sorted(model.capabilities);
  const roles = [
    ...new Set([...model.roles.keys(), ...caps.flatMap((c) => c.data.roles.map((r) => r.role))]),
  ].sort();
  return (
    ['# Role × capability matrix', '', roleMatrix(caps, roles, '_generated/role-matrix.md')].join('\n') + '\n'
  );
}

export function index(model: SpecModel): string {
  const docs = <T>(m: Map<string, LocatedDoc<T>>) =>
    sorted(m).map((d) => ({ ...(d.data as object), file: d.file }));
  const items = <T extends object>(m: Map<string, { id: string; data: T; file: string }>) =>
    sorted(m).map((d) => ({ ...d.data, file: d.file }));
  return (
    JSON.stringify(
      {
        application: model.application ? { ...model.application.data, file: model.application.file } : null,
        modules: docs(model.modules),
        capabilities: sorted(model.capabilities).map((c) => ({
          ...c.data,
          acceptance_criteria: acceptanceCriteria(c.body).map((a) => a.id),
          file: c.file,
        })),
        screens: docs(model.screens),
        entities: docs(model.entities),
        flows: docs(model.flows),
        rules: items(model.rules),
        events: items(model.events),
        personas: items(model.personas),
        roles: items(model.roles),
        decisions: items(model.decisions),
        glossary: model.glossary.map((g) => ({ ...g.data, file: g.file })),
        changes: docs(model.changes),
      },
      null,
      2,
    ) + '\n'
  );
}
