---
id: FLOW-001
title: "New article to sellable"
status: refined
roles: [ROLE-CATALOG-MANAGER, ROLE-PURCHASER, ROLE-PRICING-MANAGER, ROLE-SALES-STAFF]
steps:
  - step: 1
    capability: CAP-CAT-004
    role: ROLE-CATALOG-MANAGER
  - step: 2
    capability: CAP-CAT-005
    role: ROLE-CATALOG-MANAGER
  - step: 3
    capability: CAP-SUP-004
    role: ROLE-PURCHASER
  - step: 4
    capability: CAP-PRC-001
    role: ROLE-PRICING-MANAGER
  - step: 5
    capability: CAP-PRC-002
    role: ROLE-PRICING-MANAGER
  - step: 6
    capability: CAP-GLB-001
    role: ROLE-SALES-STAFF
---

# New article to sellable

## Goal

A new article goes from idea to something sales staff can quote.

## Trigger

The company decides to sell a new article.

## Steps

1. CAP-CAT-004 by ROLE-CATALOG-MANAGER
2. CAP-CAT-005 by ROLE-CATALOG-MANAGER
3. CAP-SUP-004 by ROLE-PURCHASER
4. CAP-PRC-001 by ROLE-PRICING-MANAGER
5. CAP-PRC-002 by ROLE-PRICING-MANAGER
6. CAP-GLB-001 by ROLE-SALES-STAFF

## Outcome

The article is active with a valid sales price above its purchase price, and sales staff find it.

## Exceptions

If no approved supplier offers the article, it stays without a purchase price and pricing waits.
