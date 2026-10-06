---
id: CAP-PAY-002
title: Issue payslip
module: MOD-PAY
status: draft
version: 1
roles:
  - role: ROLE-ACCOUNTANT
    scope: org
screens: [SCR-PAY-01]
entities:
  - entity: ENT-PAYSLIP
    ops: [R, U, A]
    transitions: [draft->issued]
rules: [RULE-001]
events: { emits: [], consumes: [EVT-BANK-PAYMENT-CONFIRMED] }
depends_on: [CAP-PAY-001]
flows: [FLOW-001]
---

# Issue payslip

## Summary and user story

Issue payslip.

## Main flow

1. On SCR-PAY-01, the person uses the matching action.

## Acceptance criteria

### CAP-PAY-002-AC-01

- **Given** the preconditions hold
- **When** the person completes the main flow
- **Then** the result is recorded
