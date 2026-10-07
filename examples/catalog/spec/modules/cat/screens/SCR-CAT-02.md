---
id: SCR-CAT-02
title: "Master data"
module: MOD-CAT
status: refined
roles:
  - role: ROLE-CATALOG-MANAGER
fields:
  - entity: ENT-BRAND
    attributes: [Name]
    mode: list
  - entity: ENT-CATEGORY
    attributes: [Name, Parent category]
    mode: list
  - entity: ENT-UNIT-OF-MEASURE
    attributes: [Code, Name]
    mode: list
entry_points: []
actions:
  - id: A01
    label: Units of measure
    capability: CAP-CAT-003
  - id: A02
    label: Brands
    capability: CAP-CAT-001
  - id: A03
    label: Categories
    capability: CAP-CAT-002
mockups: []
---

# Master data

## Purpose

Maintain the brands, categories and units of measure articles are described with.

## Entry points

Main menu.

## Displayed data

Names and states of brands, categories and units of measure, with how many articles use each.

## Actions

- A01 Units of measure → CAP-CAT-003
- A02 Brands → CAP-CAT-001
- A03 Categories → CAP-CAT-002

## Per-role differences

Only catalog managers see this screen.

## Business states

- **Empty:** no entries yet; the first one can be added.
- **No permission:** other roles are sent to the article search.
- **Validation errors:** a name already in use.

## Used by capabilities

<!-- GENERATED:start screen-capabilities hash=6efeade2a01a -->
| Capability | Title | Via |
| --- | --- | --- |
| [CAP-CAT-001](../capabilities/CAP-CAT-001.md) | Maintain brands | listed by capability, action A02 |
| [CAP-CAT-002](../capabilities/CAP-CAT-002.md) | Maintain categories | listed by capability, action A03 |
| [CAP-CAT-003](../capabilities/CAP-CAT-003.md) | Maintain units of measure | listed by capability, action A01 |
<!-- GENERATED:end -->
