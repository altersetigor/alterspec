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

## Prototype and experience

Every screen lists the data it shows in `fields`, so the spec renders as a clickable
[generic prototype](spec/_generated/prototype/index.html) with made-up data, written by `alterspec views`.

The applied **[CHG-003 Experience for sales price review](spec/changes/archive/CHG-003/proposal.md)** added the
experience layer: the starter [design system](spec/experience/design-system.md) and
[patterns](spec/experience/patterns.md), and the sales price review designed in detail —
its [experience contract](spec/experience/screens/UX-SCR-PRC-01.md) and its
[mockup](spec/experience/mockups/SCR-PRC-01.html), checked element by element against
[SCR-PRC-01](spec/modules/prc/screens/SCR-PRC-01.md) and reviewed. That is why the Pricing handoffs pass the
experience gate, while handing off the Catalog module is refused until its screens are designed too.

The applied **[CHG-004 Sales price review as a working app](spec/changes/archive/CHG-004/proposal.md)** moved the
mockups onto the application runtime: open [the sign-in page](spec/experience/mockups/index.html), sign in as the
pricing analyst and propose or approve a sales price.

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
npx @alterset/alterspec handoff MOD-CAT --target openspec --allow-draft -C examples/catalog   # refused: no experience yet
```

## How it was built

Every object was created with `alterspec new`, so its ID came from the tool. The content was then written in
business language, the first version was baselined, and all three changes went through `change new`, `change edit`,
`impact`, `change status` and `apply`. The handoff folders are the unedited output of `alterspec handoff`.
