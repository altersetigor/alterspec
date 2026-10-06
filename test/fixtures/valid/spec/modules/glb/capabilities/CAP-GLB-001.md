---
id: CAP-GLB-001
title: View my payslips
module: MOD-GLB
status: draft
version: 1
roles:
  - role: ROLE-EMPLOYEE
    scope: own
screens: [SCR-GLB-01]
entities:
  - entity: ENT-PAYSLIP
    ops: [R]
rules: []
events: { emits: [], consumes: [] }
depends_on: []
flows: [FLOW-001]
---

# View my payslips

## Summary and user story

View my payslips.

## Main flow

1. On SCR-GLB-01, the person uses the matching action.

## Acceptance criteria

### CAP-GLB-001-AC-01

- **Given** the preconditions hold
- **When** the person completes the main flow
- **Then** the result is recorded
