---
id: CAP-SUP-002
title: "Approve supplier"
module: MOD-SUP
status: refined
version: 1
roles:
  - role: ROLE-PURCHASER
    scope: org
screens: [SCR-SUP-01]
entities:
  - entity: ENT-SUPPLIER
    ops: [R, U]
    transitions: [prospective->approved]
rules: []
events:
  emits: []
  consumes: []
depends_on: [CAP-SUP-001]
flows: [FLOW-005]
---

# Approve supplier

## Summary and user story

As a buyer (PER-BUYER), I want to approve a checked supplier, so that it can offer purchase prices.

## Business value / problem

Purchase prices only come from suppliers the organisation trusts (RULE-SUP-001).

## Preconditions and triggers

A prospective supplier has been checked outside the product.

## Main flow

1. On SCR-SUP-01, the purchaser opens a prospective supplier and uses action A02 Approve.
2. The supplier becomes approved.

## Alternative and exception flows

None.

## Data in / data out

In: the prospective supplier. Out: the approved supplier.

## Business rules applied

None.

## State transitions caused

ENT-SUPPLIER prospective -> approved.

## Notifications

None.

## Permissions and data visibility

Purchasers approve any supplier.

## Acceptance criteria

### CAP-SUP-002-AC-01

- **Given** a prospective supplier
- **When** the purchaser approves it
- **Then** the supplier is approved
- **Covers:** main flow step 2

## Out of scope

- How suppliers are checked before approval.

## Open questions

None.
