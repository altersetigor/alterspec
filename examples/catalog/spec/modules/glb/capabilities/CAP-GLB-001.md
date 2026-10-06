---
id: CAP-GLB-001
title: "Look up article prices"
module: MOD-GLB
status: refined
version: 1
roles:
  - role: ROLE-SALES-STAFF
    scope: all
screens: [SCR-GLB-01]
entities:
  - entity: ENT-ARTICLE
    ops: [R]
  - entity: ENT-SALES-PRICE
    ops: [R]
rules: [RULE-001]
events:
  emits: []
  consumes: []
depends_on: []
flows: [FLOW-001]
---

# Look up article prices

## Summary and user story

As a sales representative (PER-SALES-REP), I want to find an article and its valid sales price, so that I quote the right price.

## Business value / problem

Quotes use the approved price, never an outdated one.

## Preconditions and triggers

None.

## Main flow

1. On SCR-GLB-01, the sales staff member searches by article number, name, brand or category.
2. They see matching active articles with their valid sales price and unit of measure.

## Alternative and exception flows

- An active article has no valid sales price yet: it is shown as "price pending".

## Data in / data out

In: search words. Out: active articles with their valid sales price.

## Business rules applied

- RULE-001 — only active articles are shown.

## State transitions caused

None.

## Notifications

None.

## Permissions and data visibility

Sales staff see all active articles and valid sales prices; never drafts, proposals or purchase prices.

## Acceptance criteria

### CAP-GLB-001-AC-01

- **Given** an active article with a valid sales price and a discontinued article with the same brand
- **When** a sales staff member searches by that brand
- **Then** only the active article is shown, with its valid sales price
- **Covers:** RULE-001

## Out of scope

None.

## Open questions

None.
