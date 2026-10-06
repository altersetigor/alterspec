---
id: CAP-HR-002
title: Activate employee
module: MOD-HR
status: draft
version: 1
roles:
  - role: ROLE-HR-MANAGER
    scope: org
screens: [SCR-HR-01]
entities:
  - entity: ENT-EMPLOYEE
    ops: [R, U]
    transitions: [draft->active]
rules: []
events: { emits: [EVT-EMPLOYEE-HIRED], consumes: [] }
depends_on: [CAP-HR-001]
flows: [FLOW-001]
---

# Activate employee

## Summary and user story

Activate employee.

## Main flow

1. On SCR-HR-01, the person uses the matching action.

## Acceptance criteria

### CAP-HR-002-AC-01

- **Given** the preconditions hold
- **When** the person completes the main flow
- **Then** the result is recorded
