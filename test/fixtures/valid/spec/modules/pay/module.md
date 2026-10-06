---
id: MOD-PAY
title: Payslips
status: draft
depends_on: [MOD-HR]
---

# Payslips

## Description

Preparing and issuing payslips.

## Capabilities

<!-- GENERATED:start capabilities hash=13d11319dc7b -->
| Capability | Title | Status | Roles |
| --- | --- | --- | --- |
| [CAP-PAY-001](capabilities/CAP-PAY-001.md) | Prepare payslip | draft | ROLE-ACCOUNTANT (org) |
| [CAP-PAY-002](capabilities/CAP-PAY-002.md) | Issue payslip | draft | ROLE-ACCOUNTANT (org) |
<!-- GENERATED:end -->

## Role × capability matrix

<!-- GENERATED:start role-matrix hash=1dc1823ffa95 -->
| Capability | ROLE-ACCOUNTANT |
| --- | --- |
| [CAP-PAY-001](capabilities/CAP-PAY-001.md) | org |
| [CAP-PAY-002](capabilities/CAP-PAY-002.md) | org |
<!-- GENERATED:end -->

## Screens

<!-- GENERATED:start screens hash=8d6f96f176c8 -->
| Screen | Title | Actions |
| --- | --- | --- |
| [SCR-PAY-01](screens/SCR-PAY-01.md) | Payslip run | A01 Prepare → CAP-PAY-001<br>A02 Issue → CAP-PAY-002 |
<!-- GENERATED:end -->
