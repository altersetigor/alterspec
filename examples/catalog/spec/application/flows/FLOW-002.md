---
id: FLOW-002
title: "Supplier price update"
status: refined
roles: [ROLE-PURCHASER, ROLE-PRICING-MANAGER]
steps:
  - step: 1
    capability: CAP-SUP-005
    role: ROLE-PURCHASER
  - step: 2
    capability: CAP-SUP-006
    role: ROLE-PURCHASER
  - step: 3
    capability: CAP-PRC-001
    role: ROLE-PRICING-MANAGER
  - step: 4
    capability: CAP-PRC-002
    role: ROLE-PRICING-MANAGER
---

# Supplier price update

## Goal

Supplier price changes reach sales prices the same week.

## Trigger

A supplier sends a price list (EVT-SUPPLIER-PRICE-LIST-RECEIVED).

## Steps

1. CAP-SUP-005 by ROLE-PURCHASER
2. CAP-SUP-006 by ROLE-PURCHASER
3. CAP-PRC-001 by ROLE-PRICING-MANAGER
4. CAP-PRC-002 by ROLE-PRICING-MANAGER

## Outcome

New purchase prices are valid and every affected sales price still covers them.

## Exceptions

Lines for unknown articles are skipped and followed up by the purchaser.
