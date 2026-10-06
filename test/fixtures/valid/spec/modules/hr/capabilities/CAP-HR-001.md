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

As an HR lead (PER-HR-LEAD), I want to register a new employee, so that they can be activated and paid.

## Business value / problem

Every employee must be known before they can be paid.

## Preconditions and triggers

A signed employment contract exists.

## Main flow

1. On SCR-HR-01, the HR manager uses action A01 Register and enters the full name and start date.
2. The employee is recorded in state draft.

## Alternative and exception flows

- The start date is in the past: the employee is not recorded and the HR manager is told why (RULE-HR-001).

## Data in / data out

In: full name, start date. Out: the employee in state draft.

## Business rules applied

- RULE-HR-001 — the start date is checked before the employee is recorded.

## State transitions caused

None. A new employee starts in state draft.

## Notifications

None.

## Permissions and data visibility

HR managers can register employees for the whole organisation.

## Acceptance criteria

### CAP-HR-001-AC-01

- **Given** a start date of today or later
- **When** the HR manager registers the employee
- **Then** the employee is recorded in state draft
- **Covers:** main flow step 1

## Out of scope

Activating the employee (CAP-HR-002).

## Open questions

None.
