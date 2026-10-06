---
id: CAP-SUP-004
title: "Record purchase price"
module: MOD-SUP
status: refined
version: 1
roles:
  - role: ROLE-PURCHASER
    scope: org
screens: [SCR-SUP-02]
entities:
  - entity: ENT-PURCHASE-PRICE
    ops: [C, R, U]
  - entity: ENT-ARTICLE
    ops: [R]
  - entity: ENT-SUPPLIER
    ops: [R]
rules: [RULE-SUP-001]
events:
  emits: []
  consumes: []
depends_on: [CAP-SUP-002]
flows: [FLOW-001]
---

# Record purchase price

## Summary and user story

As a buyer (PER-BUYER), I want to record what a supplier charges for an article, so that pricing knows the purchase price.

## Business value / problem

A new article can only be priced once its purchase price is known.

## Preconditions and triggers

The article is active and the supplier is approved.

## Main flow

1. On SCR-SUP-02, the purchaser uses action A01 Record.
2. They choose the article and the supplier, and enter the amount and the valid-from date.
3. The purchase price is saved as proposed.

## Alternative and exception flows

- The supplier is not approved: nothing is saved and the purchaser is told (RULE-SUP-001).

## Data in / data out

In: article, supplier, amount, valid-from date. Out: a proposed purchase price.

## Business rules applied

- RULE-SUP-001 — the supplier must be approved.

## State transitions caused

None. A new purchase price starts as proposed.

## Notifications

None.

## Permissions and data visibility

Purchasers record purchase prices for all suppliers.

## Acceptance criteria

### CAP-SUP-004-AC-01

- **Given** an active article and an approved supplier
- **When** the purchaser records a purchase price
- **Then** the purchase price is saved as proposed
- **Covers:** main flow step 3

### CAP-SUP-004-AC-02

- **Given** a blocked supplier
- **When** the purchaser records a purchase price for it
- **Then** nothing is saved and the purchaser is told the supplier is not approved
- **Covers:** RULE-SUP-001

## Out of scope

None.

## Open questions

None.
