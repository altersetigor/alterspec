# alterspec

The spec changes with the product. alterspec is a product specification framework for AI-assisted delivery,
published as `@alterset/alterspec` by Alterset d.o.o. (MIT).

It keeps a tech-agnostic product spec (**Application → Module → Capability**) as the single source of truth and
evolves it through reviewed change proposals (deltas). It sits upstream of Spec Kit, OpenSpec and BMAD, and
hands off to them via `/alter-handoff`.

The full build brief, with every decision made so far, is in [docs/HANDOVER.md](docs/HANDOVER.md). Read it
before starting a phase or changing the content model, IDs, validation rules or install layout.

## Working rules

- **Plan first.** Before each phase (see HANDOVER §9), enter plan mode, present the plan and wait for approval.
  Stop for user review when a phase is done.
- **Ask about open decisions** (HANDOVER §10) before you build anything that depends on them: capability
  granularity, where rules live, SR/EN bilingual scope, mockup format, who writes the spec, and whether a
  tech layer is ever in scope.
- **Check current Claude Code docs** (code.claude.com/docs) before you build or change the `.claude/` files that
  alterspec installs into user projects (skill `SKILL.md` front-matter, invocation control, subagent format).
  Commands are now skills; `.claude/commands/` is legacy. Don't rely on memory for these formats.
- **Test every linter rule** against fixture specs, with both a passing and a failing case.
- **Keep spec content tech-agnostic.** Templates, prompts and example specs must contain no DB types, endpoints,
  frameworks or libraries.
- **Don't invent product content** beyond what the example fixture needs.
- Keep dependencies small.

## Stack

TypeScript, Node 20+, ESM. Runtime dependencies: `commander` 14 (v15 needs Node 22), `yaml`, `zod` v4 (JSON Schema
via the built-in `z.toJSONSchema`). Dev: `tsup`, `vitest`, `eslint` + `typescript-eslint`, `prettier`. npm only; no Python.
`gray-matter` is deliberately not used (it pulls a vulnerable `js-yaml`); front-matter is parsed in
`src/lib/frontmatter.ts`.

- `npm test` · `npm run typecheck` · `npm run lint` · `npm run build` · `npx prettier --check .`
- `src/schemas/ids.ts` is the single source for ID formats; `src/schemas/index.ts` registers every spec type.
- Shipped content lives in `assets/` (templates, prompts, `.claude/` wrappers, default config).
  `src/install/manifest.ts` maps it to install paths and ownership policies.
- Skills reference the CLI as `npx @alterset/alterspec`, never `npx alterspec`: the unscoped name isn't ours yet,
  and npx would download whatever package holds it.

## npm and registry

- The user's global `~/.npmrc` points to a corporate Artifactory. **Never read, edit or rely on `~/.npmrc`.**
- The project `.npmrc` must keep `registry=https://registry.npmjs.org/`.
- `package.json` must keep `publishConfig: { registry: "https://registry.npmjs.org/", access: "public" }`.
- Never commit auth tokens. Any `.npmrc` containing `_authToken` stays out of git.
- Never run `npm publish` unless the user asks for it in chat.

## Two different `.claude/` folders

1. **This repo's `.claude/`**: tooling for developing alterspec (settings, dev agents). It is not shipped.
2. **The `.claude/` that `alterspec init` writes into user projects**: thin `alter-*` skill and agent wrappers
   whose sources live in this repo's package assets, not in this repo's own `.claude/`.

Don't mix them. Never put product skills such as `alter-init` in this repo's `.claude/skills/`.

## What `alterspec init` installs (target layout)

```
my-project/
├── .alterspec/        # framework-owned, replaced by `alterspec update`
│   ├── config.yaml    # languages, ID prefixes, strictness
│   ├── templates/     # application, module, capability, screen, entity, flow, rule, change…
│   ├── schemas/       # JSON Schema generated from zod
│   ├── prompts/       # full instructions for every command and agent
│   ├── custom/        # user overrides, NEVER touched by update
│   └── version
├── .claude/
│   ├── skills/alter-<cmd>/SKILL.md   # thin: "Read .alterspec/prompts/<cmd>.md and follow it"
│   └── agents/alter-*.md             # thin: points to .alterspec/prompts/agents/*
└── spec/              # user-owned product spec, never overwritten
```

`init` must be idempotent. It must never overwrite `spec/` or `.alterspec/custom/`. Prefix every installed
skill and agent with `alter-`.

## Spec content model (`spec/`)

- `application/`: `application.md`, `personas-roles.md`, `glossary.md`, `entities/ENT-*.md`, `rules.md`,
  `flows/FLOW-*.md`, `events.md`, `integrations.md`, `nfr.md`, `decisions.md`
- `modules/<mod>/`: `module.md`, `screens/SCR-*.md`, `capabilities/CAP-*.md`
- `changes/CHG-*/`: `proposal.md` and delta files; moved to `changes/archive/` after merge
- `_generated/`: matrices, traceability, coverage and lint report (never hand-edited)

**IDs** are stable and never reused: `APP`, `MOD-<CODE>`, `CAP-<MOD>-<NNN>`, `SCR-<MOD>-<NN>` / `SCR-GLB-<NN>`,
`ROLE-<NAME>`, `PER-<NAME>`, `ENT-<NAME>`, `RULE-<NNN>`, `FLOW-<NNN>`, `EVT-<NAME>`, `DEC-<NNN>`, `CHG-<NNN>`,
and `<CAP>-AC-<NN>` for acceptance criteria.

**Capability YAML front-matter is authoritative.** Module capability lists, role matrices, screen
back-references and entity coverage are generated into marked blocks and never edited by hand:
`<!-- GENERATED:start <name> --> … <!-- GENERATED:end -->`

Persona, role and permission scope (own / team / org / all) are three separate concepts.

Statuses: `draft → refined → ready → approved → implemented`.

## CLI and skills

- CLI: `init`, `update`, `validate [--json]`, `views`, `impact <CHG>`, `apply <CHG>`, `new <type>`, `doctor`.
  All deterministic work lives in the CLI. Skills call it through Bash.
- Skills: `/alter-init`, `-module`, `-capability`, `-screen`, `-entity`, `-refine`, `-validate`, `-views`,
  `-change`, `-impact`, `-apply`, `-handoff`.
- Agents: `alter-analyst` (interviewer, writes spec) and `alter-reviewer` (read-only; reports findings with
  severity and never edits the spec).

## Phases

1. Repo foundation: package setup, zod schemas, templates, `init`
2. Linter and views
3. Authoring commands and the analyst agent
4. Semantic review and change management
5. Handoff and a full example project (reference fixture)
