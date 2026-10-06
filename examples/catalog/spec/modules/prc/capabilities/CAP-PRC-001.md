---
id: CAP-PRC-001
title: "Propose sales price"
module: MOD-PRC
status: ready
version: 1
roles:
  - role: ROLE-PRICING-MANAGER
    scope: org
screens: [SCR-PRC-01]
entities:
  - entity: ENT-SALES-PRICE
    ops: [C, R, U]
  - entity: ENT-ARTICLE
    ops: [R]
  - entity: ENT-PURCHASE-PRICE
    ops: [R]
rules: [RULE-001, RULE-PRC-001]
events:
  emits: []
  consumes: [EVT-ARTICLE-ACTIVATED, EVT-PURCHASE-PRICE-CHANGED]
depends_on: []
flows: [FLOW-001, FLOW-002]
---

# Propose sales price

## Summary and user story

As a pricing analyst (PER-PRICING-ANALYST), I want to propose a sales price for an article, so that it can be sold at a price that covers what we pay.

## Business value / problem

New articles and changed purchase prices get a sales price quickly, and never one below the purchase price.

## Preconditions and triggers

An article was activated (EVT-ARTICLE-ACTIVATED) or one of its purchase prices changed (EVT-PURCHASE-PRICE-CHANGED). The article appears on SCR-PRC-01 as waiting for a sales price.

## Main flow

1. On SCR-PRC-01, the pricing manager opens an article waiting for a sales price.
2. They see its valid purchase prices and its current sales price, if any.
3. They use action A01 Propose and enter the amount and the valid-from date.
4. The amount is checked against the highest valid purchase price (RULE-PRC-001).
5. The sales price is saved as proposed and waits for approval.

## Alternative and exception flows

- The amount is not higher than the highest valid purchase price: nothing is saved and the pricing manager sees the purchase price (RULE-PRC-001).
- The article is no longer active: nothing is saved (RULE-001).
- A proposed sales price already exists for the article: it is replaced by the new proposal.

## Data in / data out

In: article, amount, valid-from date. Shown: valid purchase prices, current sales price. Out: a proposed sales price.

## Business rules applied

- RULE-001 — only active articles get a sales price.
- RULE-PRC-001 — the amount must be higher than the highest valid purchase price.

## State transitions caused

None. A new sales price starts as proposed.

## Notifications

None. The proposal appears on SCR-PRC-01 for approval.

## Permissions and data visibility

Pricing managers propose sales prices for all articles. Sales staff never see proposed prices.

## Acceptance criteria

### CAP-PRC-001-AC-01

- **Given** an active article whose highest valid purchase price is 8.00
- **When** the pricing manager proposes a sales price of 10.00
- **Then** the sales price is saved as proposed
- **Covers:** main flow step 5

### CAP-PRC-001-AC-02

- **Given** an active article whose highest valid purchase price is 8.00
- **When** the pricing manager proposes a sales price of 7.50
- **Then** nothing is saved and the pricing manager sees the purchase price of 8.00
- **Covers:** RULE-PRC-001

### CAP-PRC-001-AC-03

- **Given** a discontinued article
- **When** the pricing manager proposes a sales price
- **Then** nothing is saved
- **Covers:** RULE-001

## Out of scope

- Prices per customer group (DEC-001).
- Promotions and temporary discounts.

## Open questions

None.
