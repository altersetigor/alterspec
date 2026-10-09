# alterspec

**The spec changes with the product.**

[![license](https://img.shields.io/github/license/altersetigor/alterspec)](https://github.com/altersetigor/alterspec/blob/main/LICENSE)
![node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)

alterspec is a product specification framework for AI-assisted software delivery. It keeps your product spec as
plain Markdown in your repository and gives [Claude Code](https://code.claude.com) the commands to write it with you,
check it, change it and hand it over to development.

- **What and why, never how.** The spec describes the product in business terms: modules, capabilities, screens,
  business entities, rules and flows. Technology words are flagged by the linter.
- **One source of truth.** Every object has a stable ID, and everything that can be derived (module overviews, role
  matrices, traceability) is generated, never hand-maintained.
- **A living spec.** Once the first version is agreed, every product change goes through a reviewed change proposal
  with an impact analysis, just like code goes through pull requests.
- **Hands off to your development team.** Export a capability or module as a self-contained bundle: the spec it
  needs, the wireframe and the experience of its screens, with a manifest of the exact versions.

> alterspec is at version 0.x: the spec format may still change between minor versions.

---

## Contents

- [Requirements](#requirements)
- [Quick start](#quick-start)
- [What gets installed](#what-gets-installed)
- [The workflow](#the-workflow)
- [Claude Code commands](#claude-code-commands)
- [CLI reference](#cli-reference)
- [The spec format](#the-spec-format)
- [Validation](#validation)
- [Change management](#change-management)
- [Handoff](#handoff)
- [Wireframe and experience](#wireframe-and-experience)
- [Configuration and customisation](#configuration-and-customisation)
- [Using alterspec in CI](#using-alterspec-in-ci)
- [Updating](#updating)
- [Example project](#example-project)
- [FAQ](#faq)

---

## Requirements

- Node.js 20 or later
- [Claude Code](https://code.claude.com) for the slash commands. The CLI on its own works without it.
- A git repository is recommended: the spec, the framework files and the Claude Code commands are all meant to be
  committed so the whole team shares them.

## Quick start

alterspec is a private package: it is not published to npm, you install it from this repository. In the root of
your project:

```bash
npm install --save-dev github:altersetigor/alterspec
npx alterspec init --name "My Product"
```

npm clones the repository and builds the CLI on install, so Node 20+ and git are all you need.

Then open Claude Code in the project and describe the product:

```text
/alterspec-init A B2B catalog where suppliers publish articles and buyers order them
```

Claude reads nothing yet, drafts the application skeleton (the product and its profile, personas and roles, the
business areas, the first terms), marks everything it proposed, and asks you once. Say go and it is written. From
there you just talk:

```text
We need an Article with a name, a price and a supplier
Buyers should be able to order an article
What is still missing in "Order article"?
```

Each sentence becomes a proposal at its own size, confirmed once, then written. `/alterspec-validate` whenever you
want the full report.

> **The local install is required.** The Claude Code commands call the CLI as `npx @alterset/alterspec`, which
> resolves to the package installed in your project. Without it, npx would download an old public release from
> npm (0.6.0, no longer maintained). The short form `npx alterspec …` used in this README also needs the local
> install.

## What gets installed

`alterspec init` writes three folders. All of them are meant to be committed.

```text
my-project/
├── spec/            your product spec — alterspec never overwrites it
├── .alterspec/      templates, prompts, schemas and config.yaml
│   └── custom/      your overrides — never touched by updates
└── .claude/
    ├── skills/alterspec-*/SKILL.md   the /alterspec-* commands
    └── agents/alterspec-*.md         the analyst and reviewer agents
```

`init` is safe to run again: it only adds files that are missing. It never touches your own Claude Code skills,
agents or settings.

## The workflow

```text
 author ──► refine ──► baseline ──► change ──► impact ──► apply ──► handoff
   ▲                                  │                       │
   └──────────── before baseline ─────┘     every later edit ─┘
```

1. **Author.** `/alterspec-init` with a description of the product, then plain sentences. Everything is a grooming
   proposal (`/alterspec-groom`, which the front door invokes for you): Claude reads the spec, drafts the whole thing
   at the size of your sentence, marks every fact you didn't give as `(proposed)`, asks once, and writes on your go.
   The CLI picks every ID and file location, so nothing is guessed. The skeleton records the **product profile**:
   the channels (and whether a web channel is responsive), one company or many, languages, currencies and time
   zones. Every later proposal reads it and never asks what it settles; the linter flags spec content the profile
   rules out.
2. **Refine.** "Finish the order capability" or "what is missing in the buyer entity?" is a proposal too: the gaps,
   each with a proposed answer or an open question. When nothing is open and you agree, the object moves to
   `refined`. Moving to `ready` or `approved` always needs your explicit word.
3. **Validate.** `/alterspec-validate` runs the deterministic linter and a semantic review, and gives you one report.
   **Look at it.** `spec/_generated/wireframe/index.html` is a clickable wireframe generated from the spec.
   **Design it.** `/alterspec-experience` adds the experience layer: a UX contract and a realistic mockup per screen,
   checked element by element against the spec.
4. **Baseline.** When the first version is agreed, run `npx alterspec baseline`. From that moment on, every edit goes
   through a change proposal. Direct edits are reported as errors.
5. **Change.** The same sentences, now inside a change proposal: "add gender to buyer", "buyers should see their
   order history and reorder", "we need a returns area". The proposal is drafted, confirmed once and executed into
   `spec/changes/CHG-NNN/`; the main spec is untouched until the change is applied.
6. **Impact.** `/alterspec-impact CHG-001` shows what the change affects: flows, screens, roles, acceptance criteria and
   generated views.
7. **Apply.** `/alterspec-apply CHG-001` asks for your explicit approval ("approve CHG-001"), then merges the change,
   raises the version of every modified object and archives the proposal.
8. **Hand off.** Applying the change already exported every capability that is `ready` with reviewed screens as a
   bundle for your development team; `/alterspec-handoff MOD-CAT` does the same for a whole module.

## Claude Code commands

You don't have to know these. Say what you want in Claude Code ("add gender to buyer", "what can a sales rep do with
a price?") and Claude starts the matching skill, or `/alterspec` routes it. An idea ("buyers should see their order
history and reorder") is groomed: you get the whole proposal first, answer once, say go, and find the change ready
for review. Only starting a spec, merging a change and handing off to developers are typed by you.

| Command | What it does |
| --- | --- |
| `/alterspec [words]` | The front door: answers questions from the spec and routes a wish to the right skill below |
| `/alterspec-groom <idea \| ID \| CHG>` | The one way the spec is written: one attribute, a new screen, a feature, a new business area, an object to finish, a change to continue. The proposal first, at the size of the idea (what is new, what changes, what was not proposed, what to confirm, open questions), one round of answers, then executed on your go; a change proposal after the baseline |
| `/alterspec-init [description]` | Start from nothing: installs if needed, then grooms the application skeleton (product and profile, personas and roles, modules, glossary) from your description |
| `/alterspec-validate [scope]` | Linter plus semantic review in one report (scope: module, IDs or change) |
| `/alterspec-views` | Regenerate the generated views |
| `/alterspec-impact <CHG>` | Impact analysis of a change, for a business reader |
| `/alterspec-apply <CHG>` | Approve, after your explicit word, and merge a change |
| `/alterspec-handoff <ID>` | Export a self-contained bundle for the development team |
| `/alterspec-experience [init \| <SCR> \| review <SCR> \| sync <SCR> \| rebuild <SCR> \| lift <SCR>]` | The future app as working mockups, with a UX contract per screen kept fully aligned with the spec; `lift` carries what a mockup shows and the spec lacks into the spec as a proposal to confirm |

Four agents work behind these commands:

- **`alterspec-analyst`** finds gaps and drafts body text from answers you already gave. It never interviews you and never
  invents business facts.
- **`alterspec-reviewer`** is read-only. It looks for contradictions, data nobody produces, permission holes, untestable
  acceptance criteria, missing exception flows and glossary drift.
- **`alterspec-ux-designer`** shapes one screen's experience contract and mockup from your answers. It never touches the
  business spec; when the design needs something the spec lacks, it says so.
- **`alterspec-experience-reviewer`** is read-only. It checks a screen's contract and mockup against the business screen
  element by element and reports a parity table.

Grooming sizes itself to what it finds: on an empty spec the proposal is the skeleton; for one object it is a few
lines plus the knock-on edits of everything that references it; for a feature it is the full proposal; for a mockup
that shows something the spec lacks, `experience lift` writes the proposal from the page's markers. Before the
baseline it writes into the spec directly on your go; after it, into a change proposal that still goes through impact
and approval. The proposal document stays with the change as the record of what was considered and why.

Commands that change the spec only run when you type them. Claude can run read-only commands such as validate,
views and impact on its own.

## CLI reference

Every command accepts `-C <dir>` for the project directory and `--spec <path>` if your spec isn't in `spec/`.
Most accept `--json` for scripts and agents.

### Setup

| Command | Description |
| --- | --- |
| `alterspec init [--name <app>]` | Install into a project. Only adds missing files. |
| `alterspec update [--force]` | Refresh `.alterspec/` and the `.claude/` commands. Skips commands you edited, unless `--force`. |
| `alterspec doctor` | Check the Node version, the installed version, the config and the Claude Code files. |

### Authoring

```bash
alterspec new module     --code CAT --title "Catalog"
alterspec new role       --name catalog-manager --title "Catalog manager"
alterspec new capability --module CAT --title "Create article" --role catalog-manager --scope org
alterspec new screen     --module CAT --title "Article record"
alterspec new entity     --name article --title "Article"
alterspec new flow       --title "New article to sellable" --capability CAP-CAT-001
alterspec new rule       --title "Article numbers are unique" --module CAT
alterspec new event      --name article-activated --title "Article activated"
alterspec new persona    --name catalog-lead --title "Catalog lead" --role catalog-manager
alterspec new decision   --title "Do prices differ per customer group?" --kind open_question
alterspec new term       --term "Article" --forbidden "item,product"
alterspec new channel    --name "Sales desk" --kind web --audience "Sales staff" --responsive

alterspec profile set --tenancy single --languages en,de --default-language en --currencies EUR --time-zones single
alterspec profile show

alterspec show CAP-CAT-001        # references both ways, empty sections, open questions, findings
```

`new` always picks the next free ID, and never reuses one, even if it was removed in an earlier change.
`profile set` writes the product profile into `application.md`; with several languages or currencies it refuses
until a default is given. After the baseline both take `--change <CHG>`.

### Checking

| Command | Description |
| --- | --- |
| `alterspec validate [--json] [--report] [--change <CHG>]` | Run the 45 lint rules. Exits with 1 on errors. |
| `alterspec validate --list-rules` | List every rule with its default severity. |
| `alterspec views [--check]` | Regenerate the generated blocks and `spec/_generated/`. `--check` only reports. |

### Changes

| Command | Description |
| --- | --- |
| `alterspec baseline` | Record the agreed first version. |
| `alterspec change new --title <t> [--groom]` | Start a change proposal (`CHG-NNN`); `--groom` also writes the grooming document `groom.md`. |
| `alterspec change edit <CHG> <ID>` | Copy an object into the change so you can edit it there. |
| `alterspec change remove <CHG> <ID>` | Mark an object for removal. |
| `alterspec change sync <CHG>` | Make the experience layer follow the change: re-sync stale experience screens, draft missing ones, drop those of removed screens. |
| `alterspec change status <CHG> <status>` | `draft` → `in_review` → `approved`, or `rejected`. |
| `alterspec new <type> … --change <CHG>` | Create a new object inside a change. |
| `alterspec impact <CHG> [--write]` | Impact analysis; `--write` saves `impact.md` in the change. |
| `alterspec apply <CHG>` | Merge an approved change and archive it. |

### Handoff

| Command | Description |
| --- | --- |
| `alterspec handoff <CAP\|MOD>` | Export a self-contained bundle to `handoff/bundle/<ID>/`. |

### Experience

| Command | Description |
| --- | --- |
| `alterspec experience init [--kit]` | Add the design system, patterns and the mockup app to `spec/experience/`. Never overwrites; `--kit` refreshes the kit. |
| `alterspec experience seed` | Rewrite the demo data from the spec and add missing demo people. |
| `alterspec experience new <SCR>` | Draft a screen's experience contract and working page; both pass every check. |
| `alterspec experience rebuild <SCR> [--force]` | Render a page again from its experience contract on the current kit. A page with hand edits is kept and analysed; only `--force` replaces it. |
| `alterspec experience sync <SCR>` | Align them with a changed business screen. |
| `alterspec experience lift <SCR>` | The way back up: for every marker a page or contract carries that the spec lacks, the path up the spec tree (which objects, at which levels, which check fires while one is missing) and what to confirm. Inside a change it writes a grooming document; it never edits the spec. |
| `alterspec experience reviewed <SCR>` | Record a clean parity review; refused while anything is out of line. |

Each takes `--change <CHG>`, which is required once a baseline exists.

## The spec format

```text
spec/
├── application/
│   ├── application.md      vision, problems solved, channels and the product profile, modules
│   ├── personas-roles.md   personas (who people are) and roles (what access they have)
│   ├── glossary.md         canonical terms and the synonyms not to use
│   ├── rules.md            business rules shared by several modules
│   ├── events.md           business events and notifications
│   ├── integrations.md     external parties, business level only
│   ├── nfr.md              audit, retention, privacy, availability, languages, currencies
│   ├── decisions.md        decisions, open questions and assumptions
│   ├── entities/ENT-*.md   business entities with attributes and lifecycles
│   └── flows/FLOW-*.md     end-to-end journeys across modules
├── modules/<mod>/
│   ├── module.md
│   ├── rules.md            rules owned by this module
│   ├── capabilities/CAP-*.md
│   └── screens/SCR-*.md
├── experience/             the experience layer: design system, patterns, UX contracts, mockups
├── changes/                open change proposals, and archive/
└── _generated/             traceability, coverage, role matrix, baseline — never edit
```

### IDs

| Object | Format | Example |
| --- | --- | --- |
| Module | `MOD-<CODE>` | `MOD-CAT` |
| Capability | `CAP-<CODE>-NNN` | `CAP-CAT-004` |
| Acceptance criterion | `<CAP>-AC-NN` | `CAP-CAT-004-AC-01` |
| Screen | `SCR-<CODE>-NN`, shared: `SCR-GLB-NN` | `SCR-CAT-01` |
| Entity, role, persona, event | `ENT-`, `ROLE-`, `PER-`, `EVT-` + name | `ENT-ARTICLE` |
| Rule | `RULE-NNN` (shared) or `RULE-<CODE>-NNN` (module) | `RULE-CAT-001` |
| Flow, decision, change | `FLOW-NNN`, `DEC-NNN`, `CHG-NNN` | `FLOW-001` |
| Experience screen | `UX-` + its screen ID | `UX-SCR-PRC-01` |

### A capability

The front-matter is the source of truth; the body explains it in business language.

```markdown
---
id: CAP-PRC-001
title: "Propose sales price"
module: MOD-PRC
status: ready              # draft → refined → ready → approved → implemented
version: 1
roles:
  - role: ROLE-PRICING-MANAGER
    scope: org             # own | team | org | all
screens: [SCR-PRC-01]
entities:
  - entity: ENT-SALES-PRICE
    ops: [C, R, U]         # create, read, update, delete, archive
rules: [RULE-001, RULE-PRC-001]
events:
  emits: []
  consumes: [EVT-ARTICLE-ACTIVATED]
depends_on: []
flows: [FLOW-001]
---

# Propose sales price

## Summary and user story
## Business value / problem
## Preconditions and triggers
## Main flow
## Alternative and exception flows
## Data in / data out
## Business rules applied
## State transitions caused
## Notifications
## Permissions and data visibility
## Acceptance criteria        (### CAP-PRC-001-AC-01 with Given / When / Then)
## Out of scope
## Open questions
```

A capability is **one user goal, reached in one session, by the roles allowed to perform it**. If work pauses for
someone else, such as an approval, that becomes a separate capability, connected by a flow step or an event.

### The product profile

`application.md` carries the facts that decide how much there is to specify. With several languages or currencies, a
default is mandatory and must be one of them:

```yaml
channels:
  - name: Backoffice
    kind: backoffice            # backoffice | customer | partner | mobile | web | api | other
    audience: Pricing staff
  - name: Sales desk
    kind: web
    responsive: true            # web kinds: works on phones and tablets (mobile: `offline`)
profile:
  tenancy: single               # single | multi (with `tenant_data: shared | separate`)
  languages: [en, de]
  default_language: en
  currencies: [EUR]
  time_zones: single            # single | per_user
```

Screens may name the channels they are for (`channels: [Sales desk]`; empty means all). The interviews don't ask
about what the profile settles, the mockup app takes its currency and locale from it, and `validate` reports currency
conversion, translation, tenants or time zones in the spec when the profile rules them out (`profile-excluded`), and
multi-tenant capabilities silent about what tenants see (`tenant-visibility`).

### A screen

A screen says what people see and do, never how it looks. `fields` lists the data it shows, per entity:

```yaml
id: SCR-PRC-01
title: "Sales price review"
module: MOD-PRC
roles:
  - role: ROLE-PRICING-MANAGER
fields:
  - entity: ENT-PURCHASE-PRICE
    attributes: [Supplier, Amount, Valid from]   # exactly as the entity names them
    mode: list                                   # list | view | edit
  - entity: ENT-SALES-PRICE
    attributes: [Article, Amount, Valid from]
    mode: edit
actions:
  - id: A01
    label: Propose
    capability: CAP-PRC-001
```

The linter checks that the attributes exist, that edited data is created or updated by one of the screen's actions,
and that someone on the screen can perform each action.

### Generated content

Module capability lists, role × capability matrices, screen back-references, entity coverage and the generic
wireframe (`spec/_generated/wireframe/`) are written by `alterspec views`. Inside documents they go into marked
blocks:

```markdown
<!-- GENERATED:start role-matrix hash=… -->
…
<!-- GENERATED:end -->
```

Each block carries a hash, so an edit by hand is caught by the linter. Change the front-matter and run `views`
instead.

## Validation

`alterspec validate` runs 45 deterministic rules. Here is a selection:

| Area | Examples |
| --- | --- |
| Structure | valid YAML and schemas, unique IDs, files in the right place, no leftover placeholders |
| References | every referenced role, screen, entity, rule, event and flow exists |
| Coverage | every entity transition is performed by some capability; every entity is created, read, updated and archived |
| Events | every consumed event has an emitter or is marked external |
| Consistency | flows and capabilities agree; screen actions and capabilities agree |
| Screens | shown attributes exist; edited data is captured by an action; every action has a role on the screen |
| Experience | contracts and mockups carry every element and nothing else, with the declared labels, roles and states |
| Quality | acceptance criteria are numbered and present from `ready`; refined objects have no empty sections |
| Language | glossary synonyms and technology words in prose |
| Profile | a profile exists; screen channels are known; nothing the profile excludes is specified; tenants are visible |
| Living spec | generated views up to date and not edited; no direct edits after the baseline |

```text
spec/modules/hr/capabilities/CAP-HR-002.md
    17  error  unknown-reference               CAP-HR-002 references CAP-HR-099, which doesn't exist

1 error(s), 0 warning(s)
```

`/alterspec-validate` adds a semantic review by the `alterspec-reviewer` agent, with findings ranked critical, major or
minor.

## Change management

After `alterspec baseline`, the main spec is only changed by applying change proposals.

```text
spec/changes/CHG-001/
├── proposal.md     why, what changes, status
├── impact.md       written by `alterspec impact --write`
└── spec/…          only the objects this change adds or modifies, at the same paths as in spec/
```

- **Isolated:** the main spec stays untouched until the change is applied, and `validate --change CHG-001` checks the
  spec as it would look afterwards.
- **Parallel:** two open changes never get the same new ID. If one change is applied and touches an object the other
  also edits, the second reports a conflict, and you rebase with `change edit --rebase` after re-reading the object.
- **In step with the design:** `change sync CHG-001` makes the experience layer follow the change: experience
  screens whose business screen changed are re-synced, screens without one get a draft, the experience of a removed
  screen goes with it. What it can't decide (where a new element sits, the parity review) is listed for you, and a
  change can't go to review while a screen is stale.
- **Reviewed:** a change needs `in_review`, then your explicit approval. If it is edited after approval, it must be
  approved again.
- **Traceable:** applied changes move to `spec/changes/archive/`, modified objects get a new `version`, and the IDs they
  used are never handed out again.

## Handoff

Handoff happens when a change is applied: every capability the change touches that passes the gate (`ready` or
later, no lint errors in scope, every screen's experience reviewed) is exported, and every existing bundle whose
sources changed is refreshed. `apply` tells you what it exported and what it couldn't, with the reason. The command
is for the rest: a whole module, an early look at a draft, a re-export on demand.

```bash
npx alterspec handoff MOD-PRC
npx alterspec handoff CAP-PRC-002 --allow-draft
```

The development team gets one self-contained bundle in `handoff/bundle/<ID>/`:

- `README.md` and `bundle.json`: the capability (or module) with every role, entity, rule, event, screen, flow and
  term it needs, open questions as clarification points, and the acceptance criteria as Given/When/Then.
- `wireframe/`: a clickable wireframe of the screens in scope, with made-up data.
- with an experience layer, the UX contracts and the mockups of those screens: the app as designed.

The bundle is the input for the technical design; the plan, the architecture and the tasks are the team's.

- **Where it writes:** handoff only ever writes to `handoff/bundle/<ID>/` and replaces what was there.
- **What it refuses:** capabilities below `ready` (unless you pass `--allow-draft`), anything with lint errors, and,
  with an experience layer, any screen whose experience isn't ready, reviewed and free of findings.
- **Traceability:** every output carries `manifest.json` with the source IDs, versions and fingerprints, so you can see
  later which handoffs are out of date.

## Wireframe and experience

Two layers show what the spec describes, like a dry and a wet signal:

```text
spec/_generated/wireframe/   dry: the generic wireframe, generated from the business spec by `alterspec views`
spec/experience/             wet: the experience layer — design system, patterns, a UX contract and a realistic
                             mockup per screen
```

- **Dry: the generic wireframe.** One page per screen, with navigation from modules and entry points, the data from
  `fields` filled with made-up records, the actions (each says which capability it performs), a role picker, and
  buttons for the empty, no-permission and validation-error states. Anything the spec doesn't say yet shows as a
  highlighted "Not specified" note. It needs no design work and is always current.
- **Wet: the experience layer.** It says how the product looks and behaves, precisely enough that a developer never
  has to ask the product owner or a designer. It is part of the spec (baselined, changed through change proposals,
  handed off) and UI-technical by design: components, regions, layout, exact labels and messages, interactions,
  loading and errors, responsive and accessibility rules.
  - `design-system.md` and `mockups/kit/`: a neutral starter design system in plain CSS. Replace it with your own
    tokens and components.
  - `patterns.md`: page archetypes (list, detail, editor, dashboard, dialog) and their regions, plus state and
    microcopy patterns.
  - `screens/UX-SCR-….md`: per screen, every business element with its region, component and exact label, the
    states (each a link: `?as=<role>&state=<id>`), and how it behaves.
  - `mockups/`: **the future app, working.** A sign-in page with a card per demo person (name, persona, role) is the
    only demo feature. After signing in you get the application shell (brand, user menu, navigation filtered to your
    role), pages bound to demo data kept in the browser (lists open records, forms save, actions change data the way
    their capability says, with confirmations and messages), realistic data and photos, and nothing a real user
    wouldn't see. States are reached by link (`SCR-…html?as=<role>&state=empty`), never by controls on the page.
    `config.js` (name, logo, currency, demo people) and `data.js` (demo data) are yours; the CLI seeds them.
- **Zero deviation.** Every business element carries its spec ID in the mockup (`data-src="SCR-PRC-01.A01"`). The
  linter fails when an element is missing or added, a label differs, a role or state isn't covered, or a component
  isn't in the catalogue; it warns when the business screen changed (`experience sync`), the screen changed since
  its parity review, or a page shows something a real user wouldn't (spec IDs, notes about the mockup). A change to a business screen can't go to review until its experience screen follows, and
  **handoff refuses any screen whose experience isn't ready, reviewed and finding-free** — there is no override.

```text
/alterspec-experience init                  design system interview
/alterspec-experience SCR-PRC-01            draft, then shape the screen with the UX designer agent
/alterspec-experience review SCR-PRC-01     parity review; recorded only when everything matches
```

Open `spec/experience/mockups/index.html` in a browser and sign in.

## Configuration and customisation

`.alterspec/config.yaml` is yours; updates never overwrite it.

```yaml
version: "0.1.0"
language: en
lint:
  rules:
    capability-without-flow: off      # error | warn | off
    tech-leak: error
  tech_terms:                         # words the tech-leak rule flags
    - database
    - endpoint
    - microservice
  profile_terms:                      # words the profile-excluded rule flags, per dimension the profile rules out
    currency: [currency conversion, exchange rate]
    language: [translation, multilingual]
    tenant: [tenant, multi-tenant]
    time_zone: [time zone]
```

To change how a command behaves, copy its prompt or template into `.alterspec/custom/` and edit the copy:

```text
.alterspec/custom/prompts/groom.md               replaces .alterspec/prompts/groom.md
.alterspec/custom/prompts/_capability.md         replaces what grooming reads about capabilities
.alterspec/custom/prompts/agents/reviewer.md     replaces the reviewer's instructions
.alterspec/custom/templates/capability.md        replaces the capability template
```

The `.claude/` files are thin wrappers that read these prompts, so your customisations survive updates. Template
overrides are used by `alterspec new`, `change new` and `experience new`, and by the `incomplete-section` check, which
expects the sections of your template. Keep the front-matter and the GENERATED blocks of the original;
`alterspec doctor` reports an override whose name matches no shipped template.

## Using alterspec in CI

```yaml
# .github/workflows/spec.yml
name: spec
on: [pull_request]
jobs:
  spec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx alterspec validate
      - run: npx alterspec views --check
```

`validate` exits with 1 on errors only. To make the build strict about a warning, set that rule to `error` in
`config.yaml`.

## Updating

```bash
npm install --save-dev github:altersetigor/alterspec
npx alterspec update
npx alterspec doctor
```

The first line fetches the current `main` and rebuilds the CLI; pin a commit or a tag with `github:altersetigor/alterspec#<ref>` if you
want every developer on the same version (tags before the package went private do not build on install).

After an update, run `npx alterspec views` once: new versions can add or rename generated views, such as the wireframe (0.6 renamed `_generated/prototype/` to `_generated/wireframe/`; `views` removes the old folder).

0.7 adds the `/alterspec` front door and `/alterspec-groom`, lets Claude start the authoring skills from plain language, makes the experience follow a change (`change sync`), and hands off at `apply`. `npx alterspec update` installs the new skills and prompts; nothing in `spec/` changes.

0.8 makes grooming the one way the spec is written and removes the ten single-object skills (`/alterspec-create-*`, `/alterspec-change-*`, `/alterspec-change`, `/alterspec-refine`); `/alterspec-init` now grooms the skeleton from your description, and `experience lift` carries mockup content up into a proposal. `npx alterspec update` deletes the old wrappers (unless you edited them) and installs the new prompts; nothing in `spec/` changes.

`update` refreshes `.alterspec/` and the `.claude/` commands. It never touches `spec/`, `config.yaml` or
`.alterspec/custom/`, and it skips any command file you edited by hand (use `--force` to overwrite).

## Example project

[`examples/catalog`](https://github.com/altersetigor/alterspec/blob/main/examples/catalog/README.md) is a complete product catalog spec:
- 4 modules, 16 capabilities, 6 screens and 5 cross-module flows
- a baseline, three applied changes and one change in review
- the handoff bundle of a capability and of a module
- an experience layer with the sales price review designed, reviewed and handed off, running as a small app

It's the quickest way to see what a finished alterspec project looks like.

## FAQ

**Do I need Claude Code?**
For the interviews, reviews and drafting, yes. The CLI (`new`, `validate`, `views`, `change`, `impact`, `apply`,
`handoff`) works on its own, and the spec is plain Markdown you can edit by hand.

**Can I put technical decisions in the spec?**
No. alterspec is deliberately product-only. Technical design starts after handoff, in the tool of your choice.

**What does the development team get?**
A bundle per capability or module: the product spec it needs, the wireframe and the experience of its screens, with a
manifest of the exact versions handed over. alterspec covers only the product spec; the technical plan and tasks
belong to the team, in whatever method they use.

**Can I rename an ID?**
IDs are stable by design. To replace an object, add the new one and remove the old one through a change proposal. The
old ID is never reused.

**Is my spec sent anywhere?**
The CLI works only on local files and makes no network calls. Claude Code works with your files the way it does for
any code. Wireframe pages and mockups are plain local files; mockups
load demo photos from the image URLs in their data (a stock photo service by default) when you open them.

## License

MIT © [Alterset d.o.o.](https://alterset.net)
