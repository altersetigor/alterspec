---
id: CAP-SUP-003
title: "Block supplier"
module: MOD-SUP
status: refined
version: 1
roles:
  - role: ROLE-PURCHASER
    scope: org
screens: [SCR-SUP-01]
entities:
  - entity: ENT-SUPPLIER
    ops: [R, U, A]
    transitions: [approved->blocked, blocked->approved]
rules: []
events:
  emits: []
  consumes: []
depends_on: [CAP-SUP-002]
flows: [FLOW-005]
---

# Block supplier

## Summary and user story

As a buyer (PER-BUYER), I want to block a supplier, or lift the block, so that no prices are accepted from suppliers we stopped working with.

## Business value / problem

Stops new purchase prices from suppliers with quality or delivery problems.

## Preconditions and triggers

An approved or blocked supplier exists.

## Main flow

1. On SCR-SUP-01, the purchaser opens the supplier and uses action A03 Block, or Unblock for a blocked supplier.
2. They give a reason.
3. The supplier is blocked, or approved again.

## Alternative and exception flows

None.

## Data in / data out

In: the supplier and a reason. Out: the blocked or approved supplier.

## Business rules applied

None.

## State transitions caused

ENT-SUPPLIER approved -> blocked, and blocked -> approved.

## Notifications

None.

## Permissions and data visibility

Purchasers block and unblock any supplier.

## Acceptance criteria

### CAP-SUP-003-AC-01

- **Given** an approved supplier
- **When** the purchaser blocks it with a reason
- **Then** the supplier is blocked and no new purchase prices are accepted from it
- **Covers:** RULE-SUP-001

## Out of scope

None.

## Open questions

None.
