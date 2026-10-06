---
id: CAP-PRC-003
title: "Expire sales prices of a discontinued article"
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
    transitions: [valid->expired]
rules: [RULE-001]
events:
  emits: []
  consumes: [EVT-ARTICLE-DISCONTINUED]
depends_on: []
flows: [FLOW-004]
---

# Expire sales prices of a discontinued article

## Summary and user story

As a pricing analyst (PER-PRICING-ANALYST), I want the sales prices of a discontinued article to expire, so that nobody quotes them.

## Business value / problem

Discontinued articles disappear from price lookups the same day.

## Preconditions and triggers

An article was discontinued (EVT-ARTICLE-DISCONTINUED).

## Main flow

1. The article appears on SCR-PRC-01 with its valid and proposed sales prices.
2. The pricing manager uses action A03 Expire.
3. Its valid sales price expires and proposed ones are withdrawn.

## Alternative and exception flows

- The article has no valid sales price: it is removed from the list without changes.

## Data in / data out

In: the discontinued article. Out: expired sales prices.

## Business rules applied

- RULE-001 — a discontinued article has no valid sales price.

## State transitions caused

ENT-SALES-PRICE valid -> expired.

## Notifications

None.

## Permissions and data visibility

Pricing managers expire sales prices for all articles.

## Acceptance criteria

### CAP-PRC-003-AC-01

- **Given** a discontinued article with a valid sales price
- **When** the pricing manager expires its prices
- **Then** the sales price is expired
- **And** sales staff no longer see the article
- **Covers:** RULE-001

## Out of scope

None.

## Open questions

None.
