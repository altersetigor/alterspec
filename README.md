# alterspec

**The spec changes with the product.**

alterspec is a product specification framework for AI-assisted software delivery, built by [Alterset](https://alterset.net).

It keeps a structured, tech-agnostic product spec — **Application → Module → Capability** — as the single source of truth, and evolves it together with the product through reviewed change proposals.

> 🚧 Work in progress. Not ready for use yet.

## Why

Tools like Spec Kit, OpenSpec and BMAD focus on the developer workflow: spec → plan → tasks → code.
alterspec sits upstream: it describes **what** the product is and **why**, with no technology, so that people and AI agents work from the same aligned picture.

## Core ideas

- **Application** — vision, problems solved, apps and channels, modules, roles and personas, glossary, business entities, rules and flows
- **Module** — high-level description, capabilities, role/capability matrix, screens
- **Capability** — full business detail, from description to acceptance criteria, with screen references
- **Stable IDs and traceability** — every capability, screen, role, entity, rule and flow is linked by ID
- **Validation** — a deterministic linter plus AI semantic review to find logical misalignments and business flow or data gaps
- **Living spec** — changes go through proposals (deltas) that are reviewed, impact-analysed and merged
- **Claude Code integration** — commands and agents for creating, refining, validating and handing off specs

## Planned usage

```bash
npx @alterset/alterspec init
```

## License

MIT © Alterset d.o.o.
