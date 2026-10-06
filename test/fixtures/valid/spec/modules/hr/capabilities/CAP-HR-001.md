---
id: CAP-HR-001
title: Register employee
module: MOD-HR
status: ready
version: 1
roles:
  - role: ROLE-HR-MANAGER
    scope: org
screens: [SCR-HR-01]
entities:
  - entity: ENT-EMPLOYEE
    ops: [C, R, U]
rules: [RULE-HR-001]
events: { emits: [], consumes: [] }
depends_on: []
flows: [FLOW-001]
---

# Register employee

## Summary and user story

Register employee.

## Main flow

1. On SCR-HR-01, the person uses the matching action.

## Acceptance criteria

### CAP-HR-001-AC-01

- **Given** the preconditions hold
- **When** the person completes the main flow
- **Then** the result is recorded
