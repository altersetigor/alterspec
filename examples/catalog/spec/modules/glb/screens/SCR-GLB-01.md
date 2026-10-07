---
id: SCR-GLB-01
title: "Article search"
module: MOD-GLB
status: refined
roles:
  - role: ROLE-SALES-STAFF
fields:
  - entity: ENT-ARTICLE
    attributes: [Article number, Name, Brand, Category, Unit of measure]
    mode: list
  - entity: ENT-SALES-PRICE
    attributes: [Amount, Valid from]
    mode: view
entry_points: []
actions: []
mockups: []
---

# Article search

## Purpose

Find active articles and their valid sales price.

## Entry points

Main menu.

## Displayed data

Article number, name, brand, category, unit of measure and valid sales price of active articles.

## Actions

None. The screen only shows information.

## Per-role differences

Everyone sees the same results. Proposed prices and purchase prices are never shown.

## Business states

- **Empty:** no article matches; the search words are shown with a hint to search by brand or category.
- **No permission:** not applicable; everyone may search.
- **Validation errors:** none.

## Used by capabilities

<!-- GENERATED:start screen-capabilities hash=aa821d0c3bb1 -->
| Capability | Title | Via |
| --- | --- | --- |
| [CAP-GLB-001](../capabilities/CAP-GLB-001.md) | Look up article prices | listed by capability |
<!-- GENERATED:end -->
