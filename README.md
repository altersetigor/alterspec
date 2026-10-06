# alterspec

**The spec changes with the product.**

alterspec is a product specification framework for AI-assisted software delivery, built by [Alterset](https://alterset.net).

It keeps a structured, tech-agnostic product spec — **Application → Module → Capability** — as the single source of
truth, and evolves it together with the product through reviewed change proposals. When a capability is ready, it hands
it over to the development tool of your choice: GitHub Spec Kit, OpenSpec, BMAD, or your own technical design.

> 🚧 Early version (0.x). The format may still change.

## Why

Tools like Spec Kit, OpenSpec and BMAD focus on the developer workflow: spec → plan → tasks → code.
alterspec sits upstream: it describes **what** the product is and **why**, with no technology, so that people and AI
agents work from the same aligned picture — and keep it aligned as the product changes.

## Quick start

```bash
npx @alterset/alterspec init
```

This adds three things to your project, all meant to be committed:

- `spec/` — your product spec. alterspec never overwrites it.
- `.alterspec/` — templates, prompts, schemas and `config.yaml`. `alterspec update` refreshes it; your overrides go in
  `.alterspec/custom/`.
- `.claude/` — `alter-*` skills and agents for [Claude Code](https://code.claude.com).

Then open Claude Code in the project and run `/alter-init`.

## Workflow

1. **Author** — `/alter-init`, `/alter-module`, `/alter-entity`, `/alter-capability`, `/alter-screen`. Claude
   interviews you and writes the spec; the CLI picks IDs and locations.
2. **Refine** — `/alter-refine <ID>` closes the gaps until an object is `refined`. `/alter-validate` runs the linter
   and a semantic review.
3. **Baseline** — when the first version is agreed, `alterspec baseline`. From then on every edit is a change.
4. **Change** — `/alter-change` collects edits in a change proposal, `/alter-impact` shows what it affects, and
   `/alter-apply` merges it after your explicit approval.
5. **Hand off** — `/alter-handoff <CAP|MOD> <target>` exports to Spec Kit, OpenSpec, BMAD or a self-contained bundle.

See the [Product Catalog example](examples/catalog/README.md) for a complete project.

## The spec

```
spec/
  application/   application.md, personas-roles.md, glossary.md, rules.md, events.md,
                 integrations.md, nfr.md, decisions.md, entities/ENT-*.md, flows/FLOW-*.md
  modules/<mod>/ module.md, rules.md, capabilities/CAP-*.md, screens/SCR-*.md
  changes/       CHG-*/ (open change proposals), archive/
  _generated/    views, baseline (never edited by hand)
```

- **Stable IDs** — `MOD-HR`, `CAP-HR-004`, `SCR-HR-02`, `ROLE-…`, `PER-…`, `ENT-…`, `RULE-…`, `FLOW-…`, `EVT-…`,
  `DEC-…`, `CHG-…`, and `CAP-HR-004-AC-01` for acceptance criteria. Never reused.
- **Capability front-matter is authoritative** — module capability lists, role matrices and coverage are generated.
- **No technology** — the linter flags technology words (configurable in `.alterspec/config.yaml`).

## CLI

| Command | What it does |
| --- | --- |
| `init`, `update`, `doctor` | install, refresh and check alterspec in a project |
| `new <type>` | create a module, capability, screen, entity, flow, rule, event, persona, role, decision or term |
| `show <ID>` | an object with its references, empty sections, open questions and findings |
| `validate` | 27 deterministic rules; `--json`, `--report`, `--change <CHG>` |
| `views` | regenerate generated blocks and `spec/_generated/`; `--check` for CI |
| `baseline` | record the agreed first version |
| `change new\|edit\|remove\|status` | work on change proposals |
| `impact <CHG>`, `apply <CHG>` | analyse and merge a change |
| `handoff <ID> --target bundle\|speckit\|openspec\|bmad\|all` | export to development tools |

Every command takes `-C <dir>` for the project directory.

## Development

```bash
npm install
npm test
npm run build
```

Requires Node 20 or later.

## License

MIT © Alterset d.o.o.
