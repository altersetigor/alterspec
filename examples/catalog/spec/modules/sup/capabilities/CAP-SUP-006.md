---
id: CAP-SUP-006
title: "Approve purchase price"
module: MOD-SUP
status: refined
version: 1
roles:
  - role: ROLE-PURCHASER
    scope: org
screens: [SCR-SUP-02]
entities:
  - entity: ENT-PURCHASE-PRICE
    ops: [R, U, A]
    transitions: [proposed->valid, valid->expired]
rules: [RULE-SUP-001]
events:
  emits: [EVT-PURCHASE-PRICE-CHANGED]
  consumes: []
depends_on: [CAP-SUP-005]
flows: [FLOW-002]
---

# Approve purchase price

## Summary and user story

As a buyer (PER-BUYER), I want to approve proposed purchase prices, so that they become valid.

## Business value / problem

Pricing works from checked purchase prices only.

## Preconditions and triggers

Proposed purchase prices exist.

## Main flow

1. On SCR-SUP-02, the purchaser selects proposed purchase prices and uses action A03 Approve.
2. Each becomes valid from its valid-from date; the previous valid price of the same supplier and article expires.
3. Pricing is told (EVT-PURCHASE-PRICE-CHANGED).

## Alternative and exception flows

None.

## Data in / data out

In: proposed purchase prices. Out: valid purchase prices, expired previous ones.

## Business rules applied

- RULE-SUP-001 — the supplier must still be approved.

## State transitions caused

ENT-PURCHASE-PRICE proposed -> valid; the previous one valid -> expired.

## Notifications

EVT-PURCHASE-PRICE-CHANGED is emitted per article.

## Permissions and data visibility

Purchasers approve purchase prices of all suppliers.

## Acceptance criteria

### CAP-SUP-006-AC-01

- **Given** a proposed purchase price and a valid one for the same supplier and article
- **When** the purchaser approves the proposed one
- **Then** it becomes valid
- **And** the previous one expires
- **And** pricing is told the purchase price changed
- **Covers:** main flow step 2

## Out of scope

None.

## Open questions

None.
