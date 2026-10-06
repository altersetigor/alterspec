---
id: SCR-PAY-01
title: Payslip run
module: MOD-PAY
status: draft
roles:
  - role: ROLE-ACCOUNTANT
actions: 
  - id: A01
    label: Prepare
    capability: CAP-PAY-001
  - id: A02
    label: Issue
    capability: CAP-PAY-002
---

# Payslip run

## Purpose

Lists this month's payslips.

## Used by capabilities

<!-- GENERATED:start screen-capabilities hash=d574e0646242 -->
| Capability | Title | Via |
| --- | --- | --- |
| [CAP-PAY-001](../capabilities/CAP-PAY-001.md) | Prepare payslip | listed by capability, action A01 |
| [CAP-PAY-002](../capabilities/CAP-PAY-002.md) | Issue payslip | listed by capability, action A02 |
<!-- GENERATED:end -->
