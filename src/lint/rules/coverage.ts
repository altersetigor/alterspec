import { codeInId, moduleCode } from '../../schemas/ids.js';
import { acceptanceCriteria } from '../../spec/acceptance.js';
import { capsUsingEntity, entityGaps } from '../../views/render.js';
import type { LintRule, RawFinding } from '../types.js';

export const invalidTransition: LintRule = {
  name: 'invalid-transition',
  severity: 'error',
  description: "A capability's state transitions exist in the entity's lifecycle.",
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const c of model.capabilities.values()) {
      c.data.entities.forEach((use, i) => {
        const entity = model.entities.get(use.entity);
        if (!entity) return;
        const allowed = new Set(entity.data.transitions.map((t) => `${t.from}->${t.to}`));
        use.transitions.forEach((t, j) => {
          if (!allowed.has(t)) {
            out.push({
              file: c.file,
              line: c.lineOf(['entities', i, 'transitions', j]),
              id: c.id,
              message: `${use.entity} has no transition ${t}`,
            });
          }
        });
      });
    }
    return out;
  },
};

export const transitionCoverage: LintRule = {
  name: 'transition-coverage',
  severity: 'warn',
  description: 'Every entity state transition is performed by at least one capability.',
  check: ({ model }) =>
    [...model.entities.values()].flatMap((e) =>
      entityGaps(model, e.id).uncovered.map((t) => {
        const i = e.data.transitions.findIndex((x) => `${x.from}->${x.to}` === t);
        return {
          file: e.file,
          line: e.lineOf(['transitions', i]),
          id: e.id,
          message: `no capability performs ${t}`,
        };
      }),
    ),
};

export const lifecycleCoverage: LintRule = {
  name: 'lifecycle-coverage',
  severity: 'warn',
  description: 'Every entity has capabilities that create, read, update and archive or delete it.',
  check: ({ model }) =>
    [...model.entities.values()]
      .filter((e) => capsUsingEntity(model, e.id).length > 0)
      .flatMap((e) => {
        const { missingOps } = entityGaps(model, e.id);
        return missingOps.length
          ? [
              {
                file: e.file,
                line: e.line,
                id: e.id,
                message: `no capability performs ${missingOps.join(', ')}`,
              },
            ]
          : [];
      }),
};

export const orphanScreen: LintRule = {
  name: 'orphan-screen',
  severity: 'warn',
  description: 'Every screen is used by at least one capability.',
  check: ({ model }) => {
    const used = new Set([...model.capabilities.values()].flatMap((c) => c.data.screens));
    return [...model.screens.values()]
      .filter((s) => !used.has(s.id))
      .map((s) => ({
        file: s.file,
        line: s.line,
        id: s.id,
        message: `${s.id} is not listed in any capability's screens`,
      }));
  },
};

export const orphanEntity: LintRule = {
  name: 'orphan-entity',
  severity: 'warn',
  description: 'Every entity is used by at least one capability.',
  check: ({ model }) =>
    [...model.entities.values()]
      .filter((e) => capsUsingEntity(model, e.id).length === 0)
      .map((e) => ({
        file: e.file,
        line: e.line,
        id: e.id,
        message: `${e.id} is not used by any capability`,
      })),
};

function eventUse(model: Parameters<LintRule['check']>[0]['model']) {
  const emitters = new Map<string, string[]>();
  const consumers = new Map<string, { cap: string; file: string; line: number }[]>();
  for (const c of model.capabilities.values()) {
    for (const e of c.data.events.emits) emitters.set(e, [...(emitters.get(e) ?? []), c.id]);
    c.data.events.consumes.forEach((e, i) => {
      consumers.set(e, [
        ...(consumers.get(e) ?? []),
        { cap: c.id, file: c.file, line: c.lineOf(['events', 'consumes', i]) },
      ]);
    });
  }
  return { emitters, consumers };
}

export const eventConsumedWithoutEmitter: LintRule = {
  name: 'event-consumed-without-emitter',
  severity: 'error',
  description: 'Every consumed event is emitted by a capability or marked external.',
  check: ({ model }) => {
    const { emitters, consumers } = eventUse(model);
    return [...consumers].flatMap(([evt, uses]) => {
      const event = model.events.get(evt);
      if (!event || event.data.external || emitters.has(evt)) return [];
      return uses.map((u) => ({
        file: u.file,
        line: u.line,
        id: u.cap,
        message: `${u.cap} consumes ${evt}, but no capability emits it and it isn't marked external`,
      }));
    });
  },
};

export const eventEmittedNotConsumed: LintRule = {
  name: 'event-emitted-not-consumed',
  severity: 'warn',
  description: 'Every emitted event is consumed by a capability or marked external.',
  check: ({ model }) => {
    const { emitters, consumers } = eventUse(model);
    return [...emitters].flatMap(([evt]) => {
      const event = model.events.get(evt);
      if (!event || event.data.external || consumers.has(evt)) return [];
      return [
        {
          file: event.file,
          line: event.line,
          id: evt,
          message: `${evt} is emitted but nothing consumes it and it isn't marked external`,
        },
      ];
    });
  },
};

export const capabilityWithoutFlow: LintRule = {
  name: 'capability-without-flow',
  severity: 'warn',
  description: 'Every capability belongs to at least one flow.',
  check: ({ model }) => {
    const inFlow = new Set([...model.flows.values()].flatMap((f) => f.data.steps.map((s) => s.capability)));
    return [...model.capabilities.values()]
      .filter((c) => !inFlow.has(c.id) && c.data.flows.length === 0)
      .map((c) => ({ file: c.file, line: c.line, id: c.id, message: `${c.id} is not part of any flow` }));
  },
};

export const flowBacklink: LintRule = {
  name: 'flow-backlink',
  severity: 'warn',
  description: "Flow steps and capabilities' `flows` lists agree.",
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const f of model.flows.values()) {
      f.data.steps.forEach((s, i) => {
        const c = model.capabilities.get(s.capability);
        if (c && !c.data.flows.includes(f.id)) {
          out.push({
            file: c.file,
            line: c.lineOf(['flows']),
            id: c.id,
            message: `${f.id} step ${i + 1} uses ${c.id}, but ${c.id} doesn't list ${f.id} in flows`,
          });
        }
      });
    }
    for (const c of model.capabilities.values()) {
      c.data.flows.forEach((fid, i) => {
        const f = model.flows.get(fid);
        if (f && !f.data.steps.some((s) => s.capability === c.id)) {
          out.push({
            file: c.file,
            line: c.lineOf(['flows', i]),
            id: c.id,
            message: `${c.id} lists ${fid}, but no step of ${fid} uses it`,
          });
        }
      });
    }
    return out;
  },
};

export const screenBacklink: LintRule = {
  name: 'screen-backlink',
  severity: 'warn',
  description: 'A capability performed from a screen action lists that screen in its `screens`.',
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const s of model.screens.values()) {
      s.data.actions.forEach((a, i) => {
        const c = model.capabilities.get(a.capability);
        if (c && !c.data.screens.includes(s.id)) {
          out.push({
            file: c.file,
            line: c.lineOf(['screens']),
            id: c.id,
            message: `${s.id} action ${a.id} performs ${c.id}, but ${c.id} doesn't list ${s.id} in screens (${s.file}:${s.lineOf(['actions', i])})`,
          });
        }
      });
    }
    return out;
  },
};

export const foreignModuleRule: LintRule = {
  name: 'foreign-module-rule',
  severity: 'warn',
  description:
    "A capability doesn't use another module's module-level rule (share it at application level instead).",
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const c of model.capabilities.values()) {
      const own = moduleCode(c.data.module);
      c.data.rules.forEach((r, i) => {
        const code = codeInId(r);
        if (code && code !== own) {
          out.push({
            file: c.file,
            line: c.lineOf(['rules', i]),
            id: c.id,
            message: `${r} belongs to MOD-${code}; move it to application/rules.md if modules share it`,
          });
        }
      });
    }
    return out;
  },
};

const NEEDS_AC = new Set(['ready', 'approved', 'implemented']);

export const acceptanceIds: LintRule = {
  name: 'acceptance-ids',
  severity: 'error',
  description: 'Acceptance criteria are numbered <CAP>-AC-01, -02… and required from status `ready`.',
  check: ({ model }) => {
    const out: RawFinding[] = [];
    for (const c of model.capabilities.values()) {
      const acs = acceptanceCriteria(c.body);
      const at = (line: number) => c.bodyLine - 1 + line;
      acs.forEach((ac, i) => {
        const expected = `${c.id}-AC-${String(i + 1).padStart(2, '0')}`;
        if (ac.id !== expected) {
          out.push({
            file: c.file,
            line: at(ac.line),
            id: c.id,
            message: `acceptance criterion "${ac.id}" should be ${expected}`,
          });
        }
      });
      if (acs.length === 0 && NEEDS_AC.has(c.data.status)) {
        out.push({
          file: c.file,
          line: c.lineOf(['status']),
          id: c.id,
          message: `${c.id} is ${c.data.status} but has no acceptance criteria`,
        });
      }
    }
    return out;
  },
};
