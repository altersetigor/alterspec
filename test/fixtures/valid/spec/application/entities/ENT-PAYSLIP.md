---
id: ENT-PAYSLIP
title: Payslip
status: draft
attributes:
  - name: Employee
    kind: reference
    required: true
    references: ENT-EMPLOYEE
  - name: Period
    kind: period
    required: true
  - name: Net amount
    kind: amount
    required: true
relationships:
  - entity: ENT-EMPLOYEE
    cardinality: one
states: [draft, issued]
initial_state: draft
transitions:
  - from: draft
    to: issued
---

# Payslip

## Description

One month's pay for one employee.

## Coverage

<!-- GENERATED:start entity-coverage hash=2cc92252e24e -->
| Capability | C | R | U | D | A | Transitions |
| --- | --- | --- | --- | --- | --- | --- |
| [CAP-GLB-001](../../modules/glb/capabilities/CAP-GLB-001.md) |  | ✓ |  |  |  | — |
| [CAP-PAY-001](../../modules/pay/capabilities/CAP-PAY-001.md) | ✓ | ✓ | ✓ |  |  | — |
| [CAP-PAY-002](../../modules/pay/capabilities/CAP-PAY-002.md) |  | ✓ | ✓ |  | ✓ | draft->issued |

_No lifecycle gaps._
<!-- GENERATED:end -->
