---
id: CAP-HR-003
title: Record employee leaving
module: MOD-HR
status: draft
version: 1
roles:
  - role: ROLE-HR-MANAGER
    scope: org
screens: [SCR-HR-01]
entities:
  - entity: ENT-EMPLOYEE
    ops: [R, U, A]
    transitions: [active->left]
rules: []
events: { emits: [], consumes: [] }
depends_on: []
flows: [FLOW-002]
---

# Record employee leaving

## Summary and user story

Record employee leaving.

## Main flow

1. On SCR-HR-01, the person uses the matching action.

## Acceptance criteria

### CAP-HR-003-AC-01

- **Given** the preconditions hold
- **When** the person completes the main flow
- **Then** the result is recorded
