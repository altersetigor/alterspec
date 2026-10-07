---
id: SCR-SUP-02
title: "Purchase prices"
module: MOD-SUP
status: refined
roles:
  - role: ROLE-PURCHASER
fields:
  - entity: ENT-PURCHASE-PRICE
    attributes: [Article, Supplier, Amount, Valid from]
    mode: edit
entry_points: [SCR-SUP-01]
actions:
  - id: A01
    label: Record
    capability: CAP-SUP-004
  - id: A02
    label: Import
    capability: CAP-SUP-005
  - id: A03
    label: Approve
    capability: CAP-SUP-006
mockups: []
---

# Purchase prices

## Purpose

Record, import and approve what suppliers charge for articles.

## Entry points

SCR-SUP-01

## Displayed data

Per article and supplier: proposed, valid and expired purchase prices with their valid-from dates.

## Actions

- A01 Record → CAP-SUP-004
- A02 Import → CAP-SUP-005
- A03 Approve → CAP-SUP-006

## Per-role differences

Only purchasers see this screen.

## Business states

- **Empty:** no purchase prices yet for the chosen supplier.
- **No permission:** other roles cannot open it.
- **Validation errors:** supplier not approved; unknown article numbers in a price list.

## Used by capabilities

<!-- GENERATED:start screen-capabilities hash=115d8e0d6fcf -->
| Capability | Title | Via |
| --- | --- | --- |
| [CAP-SUP-004](../capabilities/CAP-SUP-004.md) | Record purchase price | listed by capability, action A01 |
| [CAP-SUP-005](../capabilities/CAP-SUP-005.md) | Import supplier price list | listed by capability, action A02 |
| [CAP-SUP-006](../capabilities/CAP-SUP-006.md) | Approve purchase price | listed by capability, action A03 |
<!-- GENERATED:end -->
