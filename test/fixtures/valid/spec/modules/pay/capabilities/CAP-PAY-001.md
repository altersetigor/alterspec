---
id: CAP-PAY-001
title: Prepare payslip
module: MOD-PAY
status: draft
version: 1
roles:
  - role: ROLE-ACCOUNTANT
    scope: org
screens: [SCR-PAY-01]
entities:
  - entity: ENT-PAYSLIP
    ops: [C, R, U]
  - entity: ENT-EMPLOYEE
    ops: [R]
rules: [RULE-001]
events: { emits: [], consumes: [EVT-EMPLOYEE-HIRED] }
depends_on: []
flows: [FLOW-001]
---

# Prepare payslip

## Summary and user story

Prepare payslip.

## Main flow

1. On SCR-PAY-01, the person uses the matching action.

## Acceptance criteria

### CAP-PAY-001-AC-01

- **Given** the preconditions hold
- **When** the person completes the main flow
- **Then** the result is recorded
