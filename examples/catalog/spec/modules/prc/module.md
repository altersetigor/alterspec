---
id: MOD-PRC
title: "Pricing"
status: refined
depends_on: [MOD-CAT, MOD-SUP]
---

# Pricing

## Description

Sales prices of articles: proposing them, approving them and expiring them. It makes sure a sales price is never below the purchase price. Discounts per customer are out of scope (see DEC-001).

## Capabilities

<!-- GENERATED:start capabilities hash=b7ab7d2cede3 -->
| Capability | Title | Status | Roles |
| --- | --- | --- | --- |
| [CAP-PRC-001](capabilities/CAP-PRC-001.md) | Propose sales price | ready | ROLE-PRICING-MANAGER (org) |
| [CAP-PRC-002](capabilities/CAP-PRC-002.md) | Approve sales price | ready | ROLE-PRICING-MANAGER (org) |
| [CAP-PRC-003](capabilities/CAP-PRC-003.md) | Expire sales prices of a discontinued article | ready | ROLE-PRICING-MANAGER (org) |
<!-- GENERATED:end -->

## Role × capability matrix

<!-- GENERATED:start role-matrix hash=587d57d9d42c -->
| Capability | ROLE-PRICING-MANAGER |
| --- | --- |
| [CAP-PRC-001](capabilities/CAP-PRC-001.md) | org |
| [CAP-PRC-002](capabilities/CAP-PRC-002.md) | org |
| [CAP-PRC-003](capabilities/CAP-PRC-003.md) | org |
<!-- GENERATED:end -->

## Screens

<!-- GENERATED:start screens hash=ed42dcd11aff -->
| Screen | Title | Actions | Prototype |
| --- | --- | --- | --- |
| [SCR-PRC-01](screens/SCR-PRC-01.md) | Sales price review | A01 Propose → CAP-PRC-001<br>A02 Approve → CAP-PRC-002<br>A03 Expire → CAP-PRC-003 | [open](../../_generated/prototype/SCR-PRC-01.html) |
<!-- GENERATED:end -->
