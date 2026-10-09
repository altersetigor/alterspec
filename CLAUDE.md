# alterspec

The spec changes with the product. alterspec is a product specification framework for AI-assisted delivery,
published as `@alterset/alterspec` by Alterset d.o.o. (MIT).

It keeps a tech-agnostic product spec (**Application → Module → Capability**) as the single source of truth and
evolves it through reviewed change proposals (deltas). It is a spec-driven framework that covers only the product
spec; the technical plan and tasks belong to the development team. It delivers the spec to that team as a
self-contained bundle via `/alterspec-handoff`, and never gets a technology layer of its own.

This file is the build brief: every decision made so far is recorded here. Read it before starting a phase or
changing the content model, IDs, validation rules or install layout.

## Working rules

- **Plan first.** Before each phase (see Phases below), enter plan mode, present the plan and wait for approval.
  Stop for user review when a phase is done.
- **Ask about open decisions** (see Decisions below) before you build anything that depends on them.
- **Check current Claude Code docs** (code.claude.com/docs) before you build or change the `.claude/` files that
  alterspec installs into user projects (skill `SKILL.md` front-matter, invocation control, subagent format).
  Commands are now skills; `.claude/commands/` is legacy. Don't rely on memory for these formats.
- **Test every linter rule** against fixture specs, with both a passing and a failing case.
- **Keep spec content tech-agnostic.** Templates, prompts and example specs must contain no DB types, endpoints,
  frameworks or libraries. The one exception is the experience layer (`spec/experience/`): UI components, layout and
  interaction details only, never business content the business spec lacks.
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
  `src/install/manifest.ts` maps it to install paths and ownership policies. Templates are always read through
  `src/lib/templates.ts`, which prefers a project's `.alterspec/custom/templates/<name>` override.
- Lint rules live in `src/lint/rules/` and are registered in `src/lint/rules/index.ts`. Every rule needs a
  passing and a failing case in `test/lint/rules.test.ts`; the test fails when a rule has no case.
- `test/fixtures/valid/` must stay at zero findings. After editing it, run
  `node dist/cli.js views test/fixtures/valid` so its generated blocks stay current.
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
2. **The `.claude/` that `alterspec init` writes into user projects**: thin `alterspec-*` skill and agent wrappers
   whose sources live in this repo's package assets, not in this repo's own `.claude/`.

Don't mix them. Never put product skills such as `alterspec-init` in this repo's `.claude/skills/`.

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
│   ├── skills/alterspec-<cmd>/SKILL.md   # thin: "Read .alterspec/prompts/<cmd>.md and follow it"
│   └── agents/alterspec-*.md             # thin: points to .alterspec/prompts/agents/*
└── spec/              # user-owned product spec, never overwritten
```

`init` must be idempotent. It must never overwrite `spec/` or `.alterspec/custom/`. Prefix every installed
skill and agent with `alterspec-`; the one exception is the front door, `/alterspec`.

## Spec content model (`spec/`)

- `application/`: `application.md`, `personas-roles.md`, `glossary.md`, `entities/ENT-*.md`, `rules.md`,
  `flows/FLOW-*.md`, `events.md`, `integrations.md`, `nfr.md`, `decisions.md`
- `modules/<mod>/`: `module.md`, `screens/SCR-*.md`, `capabilities/CAP-*.md`
- `changes/CHG-*/`: `proposal.md` and delta files; moved to `changes/archive/` after merge
- `experience/`: `design-system.md`, `patterns.md`, `screens/UX-SCR-*.md`, `mockups/` (the app: `index.html` sign-in,
  one page per screen, `config.js`, `data.js`, `kit/`); UI-technical by design, baselined and changed like the rest
- `_generated/`: matrices, traceability, coverage, lint report, the generic `wireframe/` and `experience/spec.js`
  (never hand-edited)

**IDs** are stable and never reused: `APP`, `MOD-<CODE>`, `CAP-<MOD>-<NNN>`, `SCR-<MOD>-<NN>` / `SCR-GLB-<NN>`,
`ROLE-<NAME>`, `PER-<NAME>`, `ENT-<NAME>`, `RULE-<NNN>`, `FLOW-<NNN>`, `EVT-<NAME>`, `DEC-<NNN>`, `CHG-<NNN>`,
`UX-SCR-…` for experience screens, and `<CAP>-AC-<NN>` for acceptance criteria.

**Capability YAML front-matter is authoritative.** Module capability lists, role matrices, screen
back-references and entity coverage are generated into marked blocks and never edited by hand:
`<!-- GENERATED:start <name> --> … <!-- GENERATED:end -->`

Persona, role and permission scope (own / team / org / all) are three separate concepts.

Statuses: `draft → refined → ready → approved → implemented`.

## CLI and skills

- CLI: `init`, `update`, `doctor`, `validate [--json]`, `views [--check]`, `new <type>`, `show <ID>`,
  `profile set|show`, and later `impact <CHG>`, `apply <CHG>`. All deterministic work lives in the CLI (IDs, file locations, references); skills
  call it through Bash and prompts never pick IDs or copy templates themselves.
- Skills (19): `/alterspec` (the front door: answers questions from the spec and routes plain-language requests to
  the skill below that does that kind of change; `prompts/alterspec.md`); `/alterspec-groom` (an idea → one
  proposal in `spec/changes/CHG-NNN/groom.md`, drafted by the analyst's proposal mode, confirmed once, executed on
  "go" up to `in_review`; `change new --groom` writes the document from `templates/groom.md`); `/alterspec-init`;
  `-create-module|capability|screen|entity`; `-change-module|capability|screen|entity` (edit one existing object, via
  a change proposal after the baseline; shared flow in `prompts/_change-object.md`); `-refine`, `-validate`, `-views`,
  `-change`, `-impact`, `-apply`, `-handoff`, `-experience`. The skill name minus `alterspec-` is the prompt file name in
  `assets/prompts/`.
- Invocation (decided 2026-10-09): every skill's `description` is written as a trigger (what the person says, the
  object type and ID prefix, an example), so Claude Code may start it from plain language. Only `init`, `apply` and
  `handoff` keep `disable-model-invocation: true`; `_shared.md` forbids starting those, or `baseline`, from a
  sentence. The person never needs to know a skill name; the guard is the interview, the summary before writing
  and the change proposal, not the slash command.
- Agents: `alterspec-analyst` (gap analysis and drafting; it does not interview, the skill in the main conversation does),
  `alterspec-reviewer` (read-only; reports findings with severity and never edits the spec), `alterspec-ux-designer`
  (edits only experience screens and mockups) and `alterspec-experience-reviewer` (read-only parity table).
- Change management (Phase 4): `alterspec baseline` records object fingerprints in `spec/_generated/baseline.json`;
  after that the `direct-edit` rule makes every edit go through a change. A change is `spec/changes/CHG-NNN/` with
  `proposal.md` and an overlay `spec/` holding only touched objects (whole docs, single collection items). `change
  edit|remove|status|sync`, `new --change`, `validate --change`, `impact`, `apply` live in `src/changes/`,
  `src/commands/change.ts` and `src/commands/change-sync.ts`. `change sync` makes the experience layer follow the
  change (see Phase 10b); `impact` carries an "Experience screens" section and `change status in_review|approved`
  refuses while one is stale. Approval is always the person's explicit word; `apply` checks `approved_hash`.
- Handoff (Phase 5): `alterspec handoff <CAP|MOD>` builds a bundle (`src/handoff/bundle.ts`) and renders it
  (`src/handoff/targets/bundle.ts`), writing only to `handoff/bundle/<ID>/`. It is the one handoff format: the
  development team gets the spec, the wireframe and the experience of the screens in scope (2026-10-09: the earlier
  exports to third-party spec tools were removed, don't reintroduce them). alterspec never gets a tech layer.
- Wireframe and experience (Phases 6–7): screens list their data in `fields`; entity attributes carry `references` /
  `options`. `src/wireframe/` builds the dry page model and renders the generic wireframe (`views` →
  `spec/_generated/wireframe/`, `manifest.json` lists every `data-src` and its roles; `views` also deletes a
  leftover `_generated/prototype/` from versions before 0.6). `src/experience/` is the wet layer:
  catalogue (`patterns.md` archetypes, `design-system.md` components), a small HTML reader, `dryHash` (only what an
  experience screen realises), `reviewHash`, and the scaffold behind `experience new|sync`. The `experience-*` lint
  rules in `src/lint/rules/experience.ts` enforce zero deviation; handoff refuses screens whose experience isn't
  ready, reviewed and finding-free (no override). Mockup files are spec objects (`file:experience/mockups/…`) and
  `change edit UX-SCR-…` copies the mockup along. The starter kit lives in `assets/experience/` (plain CSS, no CDN).
- Living mockups (Phase 8): mockups are the future app. `assets/experience/mockups/kit/` is a vanilla runtime
  (`app.js` sign-in/shell/binding/actions, `store.js` demo data in localStorage, `ui.js`, `icons.js` = bundled Lucide
  subset, ISC). `src/experience/app.ts` builds `spec.js` (written by `views` to `_generated/experience/`), the default
  `config.js` (demo people from personas, neutral English defaults) and seeded `data.js`; `scaffold.ts` renders pages
  bound to the store, with `data-effect` derived from the capability (create / transition / update / archive /
  delete, `own` scope). No reviewer chrome on pages (`experience-chrome`); states by URL only. `experience rebuild`
  never overwrites a hand-edited page: the contract's `page:` fingerprint says whether the page is still the CLI's
  render; otherwise the fresh render goes to `_generated/experience/rebuild/` with an analysis (`--force` only by the
  person's word). Binary assets go
  through `encodingOf` (latin1) in `src/spec/files.ts`. Keep defaults neutral: nothing product- or locale-specific.
- `examples/catalog/` is the reference example and a golden fixture: tests require 0 findings, current views, and that
  re-running its handoffs (`--date 2026-10-07`) reproduces `examples/catalog/handoff/` byte for byte. Its applied
  CHG-003 adds the experience layer with SCR-PRC-01 designed and reviewed; CHG-004 moves it onto the app runtime.
  After changing a renderer or bumping the package version, regenerate it: `node dist/cli.js views examples/catalog`,
  `node dist/cli.js handoff CAP-PRC-001 --date 2026-10-07 -C examples/catalog` and
  `node dist/cli.js handoff MOD-PRC --date 2026-10-07 -C examples/catalog`.
- Product profile (Phase 9): `application.md` front-matter holds `channels` (with optional `responsive` / `offline`)
  and `profile` (`tenancy` [+ `tenant_data`], `languages` [+ `default_language`, `localised_content`], `currencies`
  [+ `default_currency`], `time_zones` [+ `time_zone`]); schema in `src/schemas/application.ts`, a default is
  mandatory when a list has several values. Screens have an optional `channels` list. Written only by
  `alterspec new channel` and `alterspec profile set` (`src/commands/profile.ts`, front-matter edits through
  `src/lib/frontmatter-edit.ts`). Consumers: `_shared.md` (never ask what the profile settles, never specify what it
  excludes), `init.md` (the profile interview), the create prompts, the rules in `src/lint/rules/profile.ts`
  (`profile-missing`, `screen-channel`, `profile-excluded` with `lint.profile_terms`, `tenant-visibility`), and
  `defaultConfig` in `src/experience/app.ts` (currency and locale). Every profile field has a consumer; don't add
  fields nobody reads. Audit and data residency were deferred (2026-10-09).
- Decided: interview-then-draft; `refine` moves status to `refined` at most, anything beyond needs the person's
  explicit word. Granularity and rule placement: see Decisions below.

## Decisions

Decided (don't reopen without the person's word):

- **Capability granularity** (2026-10-09): one user goal, reached in one session, performed by one or several roles
  (each with its own scope). A hand-over between roles (an approval, a reply) is two capabilities joined by a flow
  step or an event; several roles doing the same thing is one.
- **Where rules live** (2026-10-09): shared rules in `application/rules.md` as `RULE-NNN`, module-own rules in
  `modules/<mod>/rules.md` as `RULE-<MOD>-NNN`; `foreign-module-rule` warns when a capability uses another module's
  rule.
- **Language** (2026-10-09): English only. `config.language` stays `en`; no SR/EN pairs in glossary or templates.
- **Mockups** (2026-10-07, revised 2026-10-08): a generic HTML wireframe generated from the spec, plus the experience
  layer. The experience layer is UI-only and must match the business spec exactly before handoff; backend, data and
  architecture design stay outside alterspec.
- **Naming** (0.2.0): installed skills and agents are prefixed `alterspec-`; front-matter is parsed without
  `gray-matter`.
- **Product profile** (2026-10-09): the core five dimensions (channels with responsive/offline, tenancy, languages,
  currencies, time zones) live in `application.md`; with several languages or currencies a default is mandatory;
  screens may name their channels. Audit and data residency stay out until they have a consumer.

- **Who writes the spec** (2026-10-09): both. The single-object skills (`create-*`, `change-*`, `refine`) stay
  interview-then-draft. Grooming (`/alterspec-groom`) is draft-then-confirm: the analyst drafts a whole proposal
  from an idea, every fact not in the idea or the spec is marked `(proposed)` and listed to confirm, nothing is
  written into the spec before the person says go, and `apply` still needs their approval by name.

Open (ask before building anything that depends on it):

- None at the moment.

## Phases

1. Repo foundation: package setup, zod schemas, templates, `init`
2. Linter and views
3. Authoring commands and the analyst agent
4. Semantic review and change management
5. Handoff and a full example project (reference fixture)
6. Screen fields and the generated (dry) wireframe
7. Experience layer: UX contracts and realistic mockups, zero-deviation checks and the handoff gate
8. Living mockups: the experience mockups are a working app (sign-in as a role, demo data, real-app look)
9. Product profile: channels, tenancy, languages, currencies and time zones recorded at init and consumed by
   prompts, lint and the mockup app, so nothing is specified that the product doesn't need
10. Conversational alterspec, step by step (agreed 2026-10-09): (a) the front door and model-invocable skills, done;
    (b) `alterspec change sync <CHG>` (`src/commands/change-sync.ts`), done: re-syncs stale experience screens,
    drafts missing ones for screens the change touches, drops those of removed screens; `impact` reports an
    "Experience screens" section (`experienceImpact` in `src/changes/impact.ts`) and `change status in_review|approved`
    refuses while a screen is stale, orphaned, or ready without an experience; (c) grooming (`/alterspec-groom`, `prompts/groom.md`, the analyst's proposal mode, `templates/groom.md`,
    `change new --groom`), done: one proposal drafted from an idea, asked once, executed on the person's "go" up to
    `in_review`; the decision "who writes the spec" is recorded above; (d) `apply` hands off every touched capability that passes the gate and
    refreshes stale bundles. After each step, update the guide in the user's voice.
