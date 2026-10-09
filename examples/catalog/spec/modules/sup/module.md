---
id: MOD-SUP
title: "Suppliers"
status: refined
depends_on: [MOD-CAT]
---

# Suppliers

## Description

Suppliers, their approval, and the purchase prices they offer for articles. It does not cover orders or invoices from suppliers.

## Capabilities

<!-- GENERATED:start capabilities hash=f6b7385cd875 -->
| Capability | Title | Status | Roles |
| --- | --- | --- | --- |
| [CAP-SUP-001](capabilities/CAP-SUP-001.md) | Register supplier | refined | ROLE-PURCHASER (org) |
| [CAP-SUP-002](capabilities/CAP-SUP-002.md) | Approve supplier | refined | ROLE-PURCHASER (org) |
| [CAP-SUP-003](capabilities/CAP-SUP-003.md) | Block supplier | refined | ROLE-PURCHASER (org) |
| [CAP-SUP-004](capabilities/CAP-SUP-004.md) | Record purchase price | refined | ROLE-PURCHASER (org) |
| [CAP-SUP-005](capabilities/CAP-SUP-005.md) | Import supplier price list | refined | ROLE-PURCHASER (org) |
| [CAP-SUP-006](capabilities/CAP-SUP-006.md) | Approve purchase price | refined | ROLE-PURCHASER (org) |
<!-- GENERATED:end -->

## Role × capability matrix

<!-- GENERATED:start role-matrix hash=852f18816e83 -->
| Capability | ROLE-PURCHASER |
| --- | --- |
| [CAP-SUP-001](capabilities/CAP-SUP-001.md) | org |
| [CAP-SUP-002](capabilities/CAP-SUP-002.md) | org |
| [CAP-SUP-003](capabilities/CAP-SUP-003.md) | org |
| [CAP-SUP-004](capabilities/CAP-SUP-004.md) | org |
| [CAP-SUP-005](capabilities/CAP-SUP-005.md) | org |
| [CAP-SUP-006](capabilities/CAP-SUP-006.md) | org |
<!-- GENERATED:end -->

## Screens

<!-- GENERATED:start screens hash=0b1cab45df5a -->
| Screen | Title | Actions | Wireframe |
| --- | --- | --- | --- |
| [SCR-SUP-01](screens/SCR-SUP-01.md) | Supplier record | A01 Register → CAP-SUP-001<br>A02 Approve → CAP-SUP-002<br>A03 Block → CAP-SUP-003 | [open](../../_generated/wireframe/SCR-SUP-01.html) |
| [SCR-SUP-02](screens/SCR-SUP-02.md) | Purchase prices | A01 Record → CAP-SUP-004<br>A02 Import → CAP-SUP-005<br>A03 Approve → CAP-SUP-006 | [open](../../_generated/wireframe/SCR-SUP-02.html) |
<!-- GENERATED:end -->
