# alterspec — Handover & Build Brief for Claude Code

You are starting the implementation of **alterspec**. This brief captures every decision made so far.
Read it fully, then **enter plan mode** and propose a Phase 1 plan before writing code.

---

## 1. What alterspec is

**Tagline:** "alterspec — the spec changes with the product."

A product specification framework for AI-assisted software delivery, by Alterset d.o.o.
Similar in spirit to BMAD-METHOD, GitHub Spec Kit and OpenSpec, but positioned **upstream** of them:

- Those tools are developer-centric (spec → plan → tasks → code).
- alterspec is a **tech-agnostic PRODUCT spec layer** (what/why). Spec content contains **no technology**
  (no DB types, endpoints, frameworks, libraries).
- It is a **living spec**: spec and product change together. Every product change goes through a change
  proposal (delta) that updates the spec.
- A `/alter-handoff` command later exports capability bundles into dev tools (Spec Kit / OpenSpec / BMAD)
  or into a tech layer.

## 2. Naming & distribution (decided)

- Name: **alterspec**
- npm: `@alterset/alterspec` (published as 0.0.1 placeholder). Unscoped `alterspec` was free — reserve it too.
- Install UX target: `npx alterspec init` (or `npx @alterset/alterspec init`)
- Language: **TypeScript, Node 20+** (npm-native CLI; no Python).
- Local dev note: the user's global `~/.npmrc` points to a corporate Artifactory. This repo MUST contain a
  project `.npmrc` with `registry=https://registry.npmjs.org/`. `package.json` must have
  `publishConfig: { registry: "https://registry.npmjs.org/", access: "public" }`. Never touch `~/.npmrc`.
  Never commit auth tokens (`.npmrc` with `_authToken` goes in `.gitignore`).
- GitHub repo: to be created (`alterset/alterspec` or the user's account).

## 3. How it installs into a user's project (decided)

Claude Code only discovers skills/commands/agents inside `.claude/` (or user-level / plugins), NOT in a custom
folder. So the installer writes to two places — same pattern as Spec Kit (`.specify/` + `.claude/commands`)
and BMAD (`_bmad/` + skills):

```
my-project/
├── .alterspec/               # framework-owned; replaced by `alterspec update`
│   ├── config.yaml           # project config (languages, id prefixes, strictness)
│   ├── templates/            # application, module, capability, screen, entity, flow, rule, change…
│   ├── schemas/              # front-matter schemas (JSON Schema generated from zod)
│   ├── prompts/              # full instructions for every command and agent
│   ├── custom/               # user overrides — NEVER touched by update (BMAD idea)
│   └── version
├── .claude/
│   ├── skills/alter-<cmd>/SKILL.md   # THIN wrappers: "Read .alterspec/prompts/<cmd>.md and follow it"
│   └── agents/alter-*.md             # thin agent wrappers pointing to .alterspec/prompts/agents/*
└── spec/                     # the actual product spec — user-owned, never overwritten
```

- Prefix everything with `alter-` to avoid collisions with user skills.
- Wrappers are thin so `alterspec update` can change logic without touching `.claude/` customizations.
- All of it is committed to git so the whole team gets the same commands.
- Later (not Phase 1): optional Claude Code plugin distribution.
- **Before implementing the `.claude/` layout, check current Claude Code docs** (code.claude.com/docs) for the
  exact skill (`.claude/skills/<name>/SKILL.md`, front-matter, invocation control) and subagent formats.
  Commands have been merged into skills; `.claude/commands/*.md` is legacy. Do not rely on memory.

## 4. Spec content model (created inside `spec/`)

```
spec/
  application/
    application.md        # index: vision, problems solved, apps/channels (API, Backoffice, Mobile iOS/Android,
                          #   Customer app, Partner app…), module list, high-level architecture (no tech detail)
    personas-roles.md     # PER-*, ROLE-*, permission scopes (own / team / org / all)
    glossary.md           # canonical terms + forbidden synonyms (+ optional SR/EN pairs)
    entities/ENT-*.md     # business attributes, relationships, lifecycle states + transitions
    rules.md              # RULE-* business rules
    flows/FLOW-*.md       # cross-module end-to-end journeys; each step → CAP id
    events.md             # EVT-* business events / notifications
    integrations.md       # external parties, business level only
    nfr.md                # audit, retention, GDPR, availability, languages, currencies
    decisions.md          # DEC-* log, open questions, assumptions
  modules/<mod>/
    module.md             # description, capability list (GENERATED), role×capability×scope matrix (GENERATED)
    screens/SCR-*.md      # purpose, entry points, displayed data, actions→CAP, per-role differences,
                          #   business states (empty, no permission, validation errors), mockup link
    capabilities/CAP-*.md
  changes/CHG-*/          # proposal.md + delta files (added / modified / removed); archive/ after merge
  _generated/             # matrices, traceability, coverage, lint report (never hand-edited)
```

Hierarchy: **Application → Module (Epic) → Capability (Story)**. Screens are owned by modules and referenced
from capabilities. Shared screens (dashboard, notifications, profile) live in a global module (`SCR-GLB-*`).

### Roles: three separate concepts
- **Persona** — who the person is, goals, pain points (narrative)
- **Role** — access-bearing identity (`ROLE-ACCOUNTANT`)
- **Permission scope** — what a role can do and on which data (own / team / org / all)

### IDs (stable, never reused)
`APP`, `MOD-<CODE>`, `CAP-<MOD>-<NNN>`, `SCR-<MOD>-<NN>` / `SCR-GLB-<NN>`, `ROLE-<NAME>`, `PER-<NAME>`,
`ENT-<NAME>`, `RULE-<NNN>`, `FLOW-<NNN>`, `EVT-<NAME>`, `DEC-<NNN>`, `CHG-<NNN>`, AC: `<CAP>-AC-<NN>`.

### Single source of truth
**Capability YAML front-matter is authoritative.** Module capability lists, role matrices, screen back-references
and entity CRUD/state coverage are **generated** into marked blocks and never hand-edited:
`<!-- GENERATED:start <name> --> … <!-- GENERATED:end -->`

Capability front-matter (define with zod; same approach for every object type):
```yaml
id: CAP-HR-004
title: …
module: MOD-HR
status: draft | refined | ready | approved | implemented
version: 1
roles: [{ role: ROLE-HR-MANAGER, scope: org }]
screens: [SCR-HR-02]
entities: [{ entity: ENT-EMPLOYEE, ops: [C, R, U], transitions: ["draft->active"] }]
rules: [RULE-012]
events: { emits: [EVT-EMPLOYEE-HIRED], consumes: [] }
depends_on: [CAP-HR-001]
flows: [FLOW-003]
```

Capability body sections (template, all tech-free):
Summary & user story (persona-based) · Business value / problem · Preconditions & triggers ·
Main flow (each step references a SCR and its actions) · Alternative & exception flows ·
Data in / data out (business terms, entity attributes) · Business rules applied (by reference) ·
State transitions caused · Notifications · Permissions & data visibility ·
Acceptance criteria (Given/When/Then, each with an ID, linked to a rule or flow step) · Out of scope · Open questions

## 5. Validation — the core value

**Layer 1 — deterministic linter (CLI, fast, CI-able, JSON + human output):**
- every referenced ID exists; no orphan screens / capabilities / entities
- roles used in capabilities exist in the application
- every entity state transition is performed by at least one capability
- every entity has full lifecycle coverage (who creates, views, edits, archives)
- every consumed event has an emitter; every emitted event is consumed or marked external
- every flow step maps to a capability; every capability belongs to ≥1 flow (or is flagged)
- every screen action maps to a capability
- front-matter matches schema; GENERATED blocks are not hand-edited (hash check)
- glossary: forbidden synonyms used instead of canonical terms → warning
- tech-leak detector: warn on technology words in spec content (configurable list)

**Layer 2 — LLM semantic review agent:** contradictions between capabilities and rules; data consumed but
produced by nobody; role/permission holes (e.g. approver absent); ambiguous ACs; missing exception flows;
glossary drift. Output is a **findings report with severity** — the agent never silently edits the spec.

## 6. Change management (living spec — OpenSpec-style deltas)

- `changes/CHG-xxx/` = `proposal.md` + delta files (added / modified / removed capabilities, screens, rules, entities)
- impact analysis before approval (which flows, matrices, screens, ACs are affected)
- on approval the delta merges into `spec/`, the change moves to `changes/archive/`, history kept
- statuses: `draft → refined → ready → approved → implemented`

## 7. Claude Code commands (skills) to build

| Command | Purpose |
|---|---|
| `/alter-init` | Interview → application skeleton (application.md, personas-roles, glossary, module list) |
| `/alter-module` | New module from template |
| `/alter-capability` | New capability; asks questions, fills front-matter + body |
| `/alter-screen` | New screen spec |
| `/alter-entity` | New business entity with lifecycle states |
| `/alter-refine <ID>` | Agent interviews the user until no open gaps remain; updates status |
| `/alter-validate` | Runs CLI linter, then semantic reviewer agent; merged findings report |
| `/alter-views` | Regenerates matrices / traceability (CLI) |
| `/alter-change <title>` | Creates a change proposal with deltas |
| `/alter-impact <CHG>` | Impact analysis of a change (CLI + agent) |
| `/alter-apply <CHG>` | Merges approved delta into spec, archives the change, regenerates views |
| `/alter-handoff <CAP|MOD>` | Exports a self-contained bundle for Spec Kit / OpenSpec / BMAD / tech design |

Subagents: `alter-analyst` (interviewer / BA, writes spec content) and `alter-reviewer` (read-only semantic
reviewer, produces findings). Commands call the CLI via Bash for all deterministic work.

## 8. CLI (`alterspec`)

`init` · `update` · `validate [--json]` · `views` · `impact <CHG>` · `apply <CHG>` · `new <type>` · `doctor`

Suggested stack: TypeScript, Node 20+, `commander`, `gray-matter`, `zod` (+ zod-to-json-schema),
`vitest`, `tsup` for build. Keep dependencies small.

## 9. Phases (stop for user review after each)

1. **Repo foundation** — package setup (.npmrc, publishConfig, tsup, vitest, lint), zod schemas for all object
   types, all templates, `alterspec init` writing `.alterspec/`, `.claude/` wrappers and `spec/` skeleton
   (idempotent; never overwrites `spec/` or `.alterspec/custom/`).
2. **Linter + views** — `validate` (all Layer 1 rules) and `views` (GENERATED blocks), with tests on a fixture spec.
3. **Authoring commands** — prompts + skills for init, module, capability, screen, entity, refine; analyst agent.
4. **Semantic review + change management** — reviewer agent, `/alter-validate` merge, change / impact / apply.
5. **Handoff + example** — handoff exports; a complete example project (an HR / invoicing / finance app with
   3–4 modules and cross-module flows) used as the reference fixture and documentation.
6. **Screen fields + prototypes** — structured `fields` on screens, `references`/`options` on entity attributes and
   alignment lint rules; a generic HTML prototype generated by `views` into `spec/_generated/prototype/`; a user-owned
   `design/` layer and design-system variants (`prototype build|check`, `/alterspec-prototype`) in `prototype/`.

## 10. Rules for working on this repo

- Plan first, show the plan, wait for approval before each phase.
- Write tests for every linter rule against fixture specs (both passing and failing cases).
- Templates and prompts must keep spec content strictly tech-agnostic.
- Don't invent product content when generating examples beyond what the example fixture needs.
- Open decisions — ask before deciding:
  1. capability granularity rule (proposal: one user goal, one session, one role)
  2. where rules live (app-level only vs module-level + shared)
  3. bilingual SR/EN support in glossary and templates (scope of v1?)
  4. ~~mockup format~~ — decided (2026-10-07): a generic HTML prototype generated from the spec, plus design-system
     variants outside `spec/`; Figma, image and other links stay allowed in a screen's `mockups`
  5. who writes (BA with AI interviewer vs AI drafts + human approval) — affects command design
  6. whether the tech layer is ever part of alterspec or strictly a handoff

**Start now:** read this file, check current Claude Code docs for skills/subagents format, then propose the
Phase 1 plan.
