---
id: CAP-PRC-002
title: "Approve sales price"
module: MOD-PRC
status: ready
version: 1
roles:
  - role: ROLE-PRICING-MANAGER
    scope: org
screens: [SCR-PRC-01]
entities:
  - entity: ENT-SALES-PRICE
    ops: [R, U, A]
    transitions: [proposed->valid, valid->expired]
rules: [RULE-001, RULE-PRC-001, RULE-PRC-002]
events:
  emits: []
  consumes: []
depends_on: [CAP-PRC-001]
flows: [FLOW-001, FLOW-002]
---

# Approve sales price

## Summary and user story

As a pricing analyst (PER-PRICING-ANALYST), I want to approve a proposed sales price, so that sales staff use it from its valid-from date.

## Business value / problem

No sales price reaches sales staff without a second look.

## Preconditions and triggers

A proposed sales price exists.

## Main flow

1. On SCR-PRC-01, the pricing manager opens a proposed sales price.
2. They use action A02 Approve.
3. The proposal is checked again against the purchase price (RULE-PRC-001).
4. It becomes valid; the previous valid sales price of the article expires.

## Alternative and exception flows

- A purchase price changed since the proposal and the amount no longer covers it: the approval is refused (RULE-PRC-001).
- The margin over the highest valid purchase price is below 10 percent: the approval is refused and the margin is shown (RULE-PRC-002).

## Data in / data out

In: the proposed sales price. Out: the valid sales price, the expired previous one.

## Business rules applied

- RULE-001 — the article must still be active.
- RULE-PRC-001 — checked again at approval, because purchase prices may have changed.
- RULE-PRC-002 — the margin is checked at approval.

## State transitions caused

ENT-SALES-PRICE proposed -> valid; the previous one valid -> expired.

## Notifications

None. Sales staff see the new price from its valid-from date.

## Permissions and data visibility

Pricing managers approve sales prices for all articles.

## Acceptance criteria

### CAP-PRC-002-AC-01

- **Given** a proposed sales price of 10.00 and a valid one of 9.00 for the same article
- **When** the pricing manager approves the proposal
- **Then** the price of 10.00 is valid
- **And** the price of 9.00 is expired
- **Covers:** main flow step 4

### CAP-PRC-002-AC-02

- **Given** a proposed sales price of 10.00 and a purchase price that rose to 10.50 since
- **When** the pricing manager approves the proposal
- **Then** the approval is refused and the new purchase price is shown
- **Covers:** RULE-PRC-001

### CAP-PRC-002-AC-03

- **Given** a proposed sales price of 10.50 and a highest valid purchase price of 10.00
- **When** the pricing manager approves the proposal
- **Then** the approval is refused and the margin of 5 percent is shown
- **Covers:** RULE-PRC-002

## Out of scope

- Approval by a second person (see open questions).

## Open questions

- Must the approver be a different person from the one who proposed the price?
