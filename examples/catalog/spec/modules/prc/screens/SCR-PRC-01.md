---
id: SCR-PRC-01
title: "Sales price review"
module: MOD-PRC
status: refined
roles:
  - role: ROLE-PRICING-MANAGER
fields:
  - entity: ENT-PURCHASE-PRICE
    attributes: [Supplier, Amount, Valid from]
    mode: list
  - entity: ENT-SALES-PRICE
    attributes: [Article, Amount, Valid from]
    mode: edit
entry_points: []
actions:
  - id: A01
    label: Propose
    capability: CAP-PRC-001
  - id: A02
    label: Approve
    capability: CAP-PRC-002
  - id: A03
    label: Expire
    capability: CAP-PRC-003
mockups: []
---

# Sales price review

## Purpose

Work through articles that need a sales price, proposals that need approval, and discontinued articles whose prices must expire.

## Entry points

Main menu.

## Displayed data

Per article: valid purchase prices, the valid sales price, proposals and the reason the article is listed.

## Actions

- A01 Propose → CAP-PRC-001
- A02 Approve → CAP-PRC-002
- A03 Expire → CAP-PRC-003

## Per-role differences

Only pricing managers see this screen.

## Business states

- **Empty:** nothing waiting; the screen says so.
- **No permission:** other roles cannot open it.
- **Validation errors:** amount not above the purchase price; article no longer active.

## Used by capabilities

<!-- GENERATED:start screen-capabilities hash=9d66758d2ac0 -->
| Capability | Title | Via |
| --- | --- | --- |
| [CAP-PRC-001](../capabilities/CAP-PRC-001.md) | Propose sales price | listed by capability, action A01 |
| [CAP-PRC-002](../capabilities/CAP-PRC-002.md) | Approve sales price | listed by capability, action A02 |
| [CAP-PRC-003](../capabilities/CAP-PRC-003.md) | Expire sales prices of a discontinued article | listed by capability, action A03 |
<!-- GENERATED:end -->
