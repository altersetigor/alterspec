# Example: Product Catalog

A small but complete alterspec project: a product catalog with brands, articles, units of measure, categories,
suppliers and prices. It is the reference example for alterspec and the fixture its tests run against.

Only `spec/` and `handoff/` are committed here. To use the slash commands on it, copy the folder and run
`npx @alterset/alterspec init` in the copy; that adds `.alterspec/` and `.claude/` without touching `spec/`.

## What's in the spec

| Module | Covers | Capabilities |
| --- | --- | --- |
| `MOD-CAT` Catalog | articles and their master data | maintain brands, categories, units of measure; create, activate, discontinue articles |
| `MOD-SUP` Suppliers | suppliers and purchase prices | register, approve, block suppliers; record, import, approve purchase prices |
| `MOD-PRC` Pricing | sales prices | propose, approve, expire sales prices |
| `MOD-GLB` Shared | screens for everyone | look up article prices |

- **Roles:** catalog manager, purchaser, pricing manager, sales staff. Each has a persona describing the people
  behind it ([personas-roles.md](spec/application/personas-roles.md)).
- **Entities with lifecycles:** article (draft → active → discontinued), supplier (prospective → approved ⇄ blocked),
  purchase and sales prices (proposed → valid → expired), and brand, category, unit of measure (active ⇄ archived).
- **Rules:** one shared rule ([rules.md](spec/application/rules.md)) and module rules such as "a sales price covers
  the purchase price" ([modules/prc/rules.md](spec/modules/prc/rules.md)).
- **Events:** an article activated or discontinued, a purchase price changed, and one external event — a supplier
  price list received ([events.md](spec/application/events.md)).
- **Flows:** five end-to-end journeys, for example
  [FLOW-001 New article to sellable](spec/application/flows/FLOW-001.md), which crosses all four modules.
- **Decisions:** one open question (sales prices per customer group) and one decision (one currency).

Generated views show the whole picture: [traceability](spec/_generated/traceability.md),
[coverage](spec/_generated/coverage.md) and the [role matrix](spec/_generated/role-matrix.md).

## The living spec

The first version was baselined (`alterspec baseline`), so every later edit goes through a change proposal:

- **[CHG-001 Minimum margin on sales prices](spec/changes/archive/CHG-001/proposal.md)** — applied. It added
  `RULE-PRC-002` and changed [CAP-PRC-002](spec/modules/prc/capabilities/CAP-PRC-002.md), which is now version 2.
  The archive keeps the proposal, the edited objects and the impact report.
- **[CHG-002 Article replacement on discontinuation](spec/changes/CHG-002/proposal.md)** — in review. It adds a
  replacement article to `ENT-ARTICLE` and changes `CAP-CAT-006`. See its [impact report](spec/changes/CHG-002/impact.md).

## Handoff

[CAP-PRC-001 Propose sales price](spec/modules/prc/capabilities/CAP-PRC-001.md) is handed off to every target:

- [bundle](handoff/bundle/CAP-PRC-001/README.md) — self-contained document for a technical design
- [Spec Kit](handoff/speckit/CAP-PRC-001/spec.md)
- [OpenSpec](handoff/openspec/CAP-PRC-001/add-propose-sales-price/)
- [BMAD](handoff/bmad/CAP-PRC-001/epics.md)

The whole Pricing module is also exported as a [bundle](handoff/bundle/MOD-PRC/README.md).

## Try it

From the alterspec repository root:

```bash
npx @alterset/alterspec validate examples/catalog
npx @alterset/alterspec show CAP-PRC-002 -C examples/catalog
npx @alterset/alterspec impact CHG-002 -C examples/catalog
npx @alterset/alterspec handoff MOD-CAT --target openspec --allow-draft -C examples/catalog
```

## How it was built

Every object was created with `alterspec new`, so its ID came from the tool. The content was then written in
business language, the first version was baselined, and both changes went through `change new`, `change edit`,
`impact`, `change status` and `apply`. The handoff folders are the unedited output of `alterspec handoff`.
