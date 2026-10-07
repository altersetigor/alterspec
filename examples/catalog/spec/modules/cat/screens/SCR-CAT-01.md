---
id: SCR-CAT-01
title: "Article record"
module: MOD-CAT
status: refined
roles:
  - role: ROLE-CATALOG-MANAGER
fields:
  - entity: ENT-ARTICLE
    attributes: [Article number, Name, Brand, Category, Unit of measure, Description]
    mode: edit
entry_points: [SCR-GLB-01]
actions:
  - id: A01
    label: Create
    capability: CAP-CAT-004
  - id: A02
    label: Activate
    capability: CAP-CAT-005
  - id: A03
    label: Discontinue
    capability: CAP-CAT-006
mockups: []
---

# Article record

## Purpose

Create an article, prepare it, activate it and discontinue it.

## Entry points

SCR-GLB-01

## Displayed data

All article attributes and the article's state; for drafts, what is still missing before activation.

## Actions

- A01 Create → CAP-CAT-004
- A02 Activate → CAP-CAT-005
- A03 Discontinue → CAP-CAT-006

## Per-role differences

Only catalog managers see this screen.

## Business states

- **Empty:** a new article with nothing filled in.
- **No permission:** other roles are sent to the article search.
- **Validation errors:** an article number already in use; missing or archived data at activation.

## Used by capabilities

<!-- GENERATED:start screen-capabilities hash=37ca0eda629a -->
| Capability | Title | Via |
| --- | --- | --- |
| [CAP-CAT-004](../capabilities/CAP-CAT-004.md) | Create article | listed by capability, action A01 |
| [CAP-CAT-005](../capabilities/CAP-CAT-005.md) | Activate article | listed by capability, action A02 |
| [CAP-CAT-006](../capabilities/CAP-CAT-006.md) | Discontinue article | listed by capability, action A03 |
<!-- GENERATED:end -->
