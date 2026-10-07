---
id: ENT-EMPLOYEE
title: Employee
status: draft
attributes:
  - name: Full name
    kind: text
    required: true
  - name: Start date
    kind: date
    required: true
  - name: Contract type
    kind: choice
    options: [Permanent, Fixed term]
states: [draft, active, left]
initial_state: draft
transitions:
  - from: draft
    to: active
  - from: active
    to: left
---

# Employee

## Description

A person employed by the organisation.

## Coverage

<!-- GENERATED:start entity-coverage hash=3d952c906a0c -->
| Capability | C | R | U | D | A | Transitions |
| --- | --- | --- | --- | --- | --- | --- |
| [CAP-HR-001](../../modules/hr/capabilities/CAP-HR-001.md) | ✓ | ✓ | ✓ |  |  | — |
| [CAP-HR-002](../../modules/hr/capabilities/CAP-HR-002.md) |  | ✓ | ✓ |  |  | draft->active |
| [CAP-HR-003](../../modules/hr/capabilities/CAP-HR-003.md) |  | ✓ | ✓ |  | ✓ | active->left |
| [CAP-PAY-001](../../modules/pay/capabilities/CAP-PAY-001.md) |  | ✓ |  |  |  | — |

_No lifecycle gaps._
<!-- GENERATED:end -->
