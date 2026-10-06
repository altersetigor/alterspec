---
id: FLOW-005
title: "Supplier lifecycle"
status: refined
roles: [ROLE-PURCHASER]
steps:
  - step: 1
    capability: CAP-SUP-001
    role: ROLE-PURCHASER
  - step: 2
    capability: CAP-SUP-002
    role: ROLE-PURCHASER
  - step: 3
    capability: CAP-SUP-003
    role: ROLE-PURCHASER
---

# Supplier lifecycle

## Goal

Suppliers are registered, approved before they offer prices, and blocked when the organisation stops working with them.

## Trigger

A purchaser wants to buy from a new supplier.

## Steps

1. CAP-SUP-001 by ROLE-PURCHASER
2. CAP-SUP-002 by ROLE-PURCHASER
3. CAP-SUP-003 by ROLE-PURCHASER

## Outcome

Only approved suppliers offer purchase prices.

## Exceptions

A blocked supplier can be approved again.
