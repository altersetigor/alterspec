# alterspec

**The spec changes with the product.**

[![npm](https://img.shields.io/npm/v/@alterset/alterspec)](https://www.npmjs.com/package/@alterset/alterspec)
[![license](https://img.shields.io/npm/l/@alterset/alterspec)](LICENSE)
![node](https://img.shields.io/node/v/@alterset/alterspec)

alterspec is a product specification framework for AI-assisted software delivery. It keeps your product spec as
plain Markdown in your repository and gives [Claude Code](https://code.claude.com) the commands to write it with you,
check it, change it and hand it over to development.

- **What and why, never how.** The spec describes the product in business terms: modules, capabilities, screens,
  business entities, rules and flows. Technology words are flagged by the linter.
- **One source of truth.** Every object has a stable ID, and everything that can be derived (module overviews, role
  matrices, traceability) is generated, never hand-maintained.
- **A living spec.** Once the first version is agreed, every product change goes through a reviewed change proposal
  with an impact analysis, just like code goes through pull requests.
- **Hands off to your dev tools.** Export a capability or module to GitHub Spec Kit, OpenSpec, BMAD, or a
  self-contained bundle for a technical design.

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

In the root of your project:

```bash
npm install --save-dev @alterset/alterspec
npx alterspec init --name "My Product"
```

Then open Claude Code in the project and start the interview:

```text
/alterspec-init
```

Claude asks about your product, its users, the apps people use and the main business areas, then writes the
application skeleton. From there:

```text
/alterspec-create-entity ARTICLE Article
/alterspec-create-capability CAT "Create article"
/alterspec-refine CAP-CAT-001
/alterspec-validate
```

> **Prefer not to install?** `npx @alterset/alterspec init` works too. The Claude Code commands call the CLI as
> `npx @alterset/alterspec`, which uses your local install when there is one and downloads it otherwise.
> The short form `npx alterspec …` used in this README needs the local install; without it, always use the scoped
> name.

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

1. **Author.** `/alterspec-init`, then `/alterspec-create-module`, `-entity`, `-capability` and `-screen`. Claude
   interviews you, at most three questions at a time, and writes the files. The CLI picks every ID and file location,
   so nothing is guessed.
2. **Refine.** `/alterspec-refine <ID>` finds the gaps in one object and asks about them until the object is complete.
   Only then does it move the object to `refined`. Moving to `ready` or `approved` always needs your explicit word.
3. **Validate.** `/alterspec-validate` runs the deterministic linter and a semantic review, and gives you one report.
4. **Baseline.** When the first version is agreed, run `npx alterspec baseline`. From that moment on, every edit goes
   through a change proposal. Direct edits are reported as errors.
5. **Change.** `/alterspec-change-capability CAP-CAT-001` (or `-module`, `-screen`, `-entity`) changes one object;
   `/alterspec-change "<title>"` collects the edits for a larger product change. Neither touches the main spec until
   the change is applied.
6. **Impact.** `/alterspec-impact CHG-001` shows what the change affects: flows, screens, roles, acceptance criteria and
   generated views.
7. **Apply.** `/alterspec-apply CHG-001` asks for your explicit approval ("approve CHG-001"), then merges the change,
   raises the version of every modified object and archives the proposal.
8. **Hand off.** `/alterspec-handoff CAP-CAT-001 openspec` exports a ready capability to your development tool.

## Claude Code commands

| Command | What it does |
| --- | --- |
| `/alterspec-init` | Interview → application, personas and roles, glossary and module list |
| `/alterspec-create-module <CODE> <title>` | Create a module and its own business rules |
| `/alterspec-create-entity <NAME> <title>` | Create a business entity with attributes and a lifecycle |
| `/alterspec-create-capability <MOD> <title>` | Interview through the 13 capability sections, then draft it |
| `/alterspec-create-screen <MOD> <title>` | Describe a screen: data shown, actions, per-role differences |
| `/alterspec-change-module <MOD>` | Change a module's description, dependencies or module rules |
| `/alterspec-change-capability <CAP>` | Change a capability's behaviour, roles, rules, data or acceptance criteria |
| `/alterspec-change-screen <SCR>` | Change a screen's data, actions or per-role differences |
| `/alterspec-change-entity <ENT>` | Change an entity's attributes, relationships or lifecycle |
| `/alterspec-refine <ID>` | Close the gaps in one object; moves it to `refined` when complete |
| `/alterspec-validate [scope]` | Linter plus semantic review in one report (scope: module, IDs or change) |
| `/alterspec-views` | Regenerate the generated views |
| `/alterspec-change <title>` | Start or continue a change proposal spanning several objects |
| `/alterspec-impact <CHG>` | Impact analysis of a change, for a business reader |
| `/alterspec-apply <CHG>` | Approve, after your explicit word, and merge a change |
| `/alterspec-handoff <ID> [target]` | Export to Spec Kit, OpenSpec, BMAD or a bundle |

Two agents work behind these commands:

- **`alterspec-analyst`** finds gaps and drafts body text from answers you already gave. It never interviews you and never
  invents business facts.
- **`alterspec-reviewer`** is read-only. It looks for contradictions, data nobody produces, permission holes, untestable
  acceptance criteria, missing exception flows and glossary drift.

The `change-*` commands edit one existing object and check everything that depends on it. Before the baseline they edit
the spec directly; after it they put the edit in a change proposal (an open one you choose, or a new one), so it still
goes through impact and approval.

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

alterspec show CAP-CAT-001        # references both ways, empty sections, open questions, findings
```

`new` always picks the next free ID, and never reuses one, even if it was removed in an earlier change.

### Checking

| Command | Description |
| --- | --- |
| `alterspec validate [--json] [--report] [--change <CHG>]` | Run the 27 lint rules. Exits with 1 on errors. |
| `alterspec validate --list-rules` | List every rule with its default severity. |
| `alterspec views [--check]` | Regenerate the generated blocks and `spec/_generated/`. `--check` only reports. |

### Changes

| Command | Description |
| --- | --- |
| `alterspec baseline` | Record the agreed first version. |
| `alterspec change new --title <t>` | Start a change proposal (`CHG-NNN`). |
| `alterspec change edit <CHG> <ID>` | Copy an object into the change so you can edit it there. |
| `alterspec change remove <CHG> <ID>` | Mark an object for removal. |
| `alterspec change status <CHG> <status>` | `draft` → `in_review` → `approved`, or `rejected`. |
| `alterspec new <type> … --change <CHG>` | Create a new object inside a change. |
| `alterspec impact <CHG> [--write]` | Impact analysis; `--write` saves `impact.md` in the change. |
| `alterspec apply <CHG>` | Merge an approved change and archive it. |

### Handoff

| Command | Description |
| --- | --- |
| `alterspec handoff <CAP\|MOD> --target <t>` | Export to `handoff/<target>/<ID>/`. Targets: `bundle`, `speckit`, `openspec`, `bmad`, `all`. |

## The spec format

```text
spec/
├── application/
│   ├── application.md      vision, problems solved, apps and channels, modules
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

A capability is **one user goal, done by one acting role, in one session**. If work pauses for someone else, such as
an approval, that becomes a separate capability, connected by a flow step or an event.

### Generated content

Module capability lists, role × capability matrices, screen back-references and entity coverage are written by
`alterspec views` into marked blocks:

```markdown
<!-- GENERATED:start role-matrix hash=… -->
…
<!-- GENERATED:end -->
```

Each block carries a hash, so an edit by hand is caught by the linter. Change the front-matter and run `views`
instead.

## Validation

`alterspec validate` runs 27 deterministic rules. Here is a selection:

| Area | Examples |
| --- | --- |
| Structure | valid YAML and schemas, unique IDs, files in the right place, no leftover placeholders |
| References | every referenced role, screen, entity, rule, event and flow exists |
| Coverage | every entity transition is performed by some capability; every entity is created, read, updated and archived |
| Events | every consumed event has an emitter or is marked external |
| Consistency | flows and capabilities agree; screen actions and capabilities agree |
| Quality | acceptance criteria are numbered and present from `ready`; refined objects have no empty sections |
| Language | glossary synonyms and technology words in prose |
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
- **Reviewed:** a change needs `in_review`, then your explicit approval. If it is edited after approval, it must be
  approved again.
- **Traceable:** applied changes move to `spec/changes/archive/`, modified objects get a new `version`, and the IDs they
  used are never handed out again.

## Handoff

```bash
npx alterspec handoff CAP-PRC-001 --target openspec
```

| Target | Output | Next step |
| --- | --- | --- |
| `bundle` | `README.md` and `bundle.json`: the capability with every role, entity, rule, event, screen, flow and term it needs | input for your technical design |
| `speckit` | GitHub Spec Kit `spec.md`: user stories with priorities, `FR-###`, `SC-###`, key entities, `[NEEDS CLARIFICATION]` | copy to `specs/<NNN>-<name>/spec.md` |
| `openspec` | OpenSpec change folder: proposal, tasks, SHALL/MUST requirements with scenarios | copy to `openspec/changes/`, run `openspec validate` |
| `bmad` | BMAD `epics.md`: an epic per module, a story per capability, Given/When/Then | give to BMAD as the epics document |

- **Where it writes:** handoff only ever writes to `handoff/<target>/<ID>/`. It never touches another tool's folders.
- **What it refuses:** capabilities below `ready` (unless you pass `--allow-draft`), and anything with lint errors.
- **Traceability:** every output carries `manifest.json` with the source IDs, versions and fingerprints, so you can see
  later which handoffs are out of date.

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
```

To change how a command behaves, copy its prompt into `.alterspec/custom/` and edit the copy:

```text
.alterspec/custom/prompts/create-capability.md          replaces .alterspec/prompts/create-capability.md
.alterspec/custom/prompts/agents/reviewer.md     replaces the reviewer's instructions
.alterspec/custom/templates/capability.md        replaces the capability template
```

The `.claude/` files are thin wrappers that read these prompts, so your customisations survive updates.

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
npm install --save-dev @alterset/alterspec@latest
npx alterspec update
npx alterspec doctor
```

`update` refreshes `.alterspec/` and the `.claude/` commands. It never touches `spec/`, `config.yaml` or
`.alterspec/custom/`, and it skips any command file you edited by hand (use `--force` to overwrite).

## Example project

[`examples/catalog`](examples/catalog/README.md) is a complete product catalog spec:
- 4 modules, 16 capabilities and 5 cross-module flows
- a baseline, one applied change and one change in review
- handoff output for every target

It's the quickest way to see what a finished alterspec project looks like.

## FAQ

**Do I need Claude Code?**
For the interviews, reviews and drafting, yes. The CLI (`new`, `validate`, `views`, `change`, `impact`, `apply`,
`handoff`) works on its own, and the spec is plain Markdown you can edit by hand.

**Can I put technical decisions in the spec?**
No. alterspec is deliberately product-only. Technical design starts after handoff, in the tool of your choice.

**What about Spec Kit, OpenSpec or BMAD — do I have to choose?**
No. alterspec sits upstream of them. Keep the product spec in alterspec and hand off each capability to whichever tool
your team uses.

**Can I rename an ID?**
IDs are stable by design. To replace an object, add the new one and remove the old one through a change proposal. The
old ID is never reused.

**Is my spec sent anywhere?**
The CLI works only on local files and makes no network calls. Claude Code works with your files the way it does for
any code.

## License

MIT © [Alterset d.o.o.](https://alterset.net)
