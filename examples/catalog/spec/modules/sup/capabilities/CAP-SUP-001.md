---
id: CAP-SUP-001
title: "Register supplier"
module: MOD-SUP
status: refined
version: 1
roles:
  - role: ROLE-PURCHASER
    scope: org
screens: [SCR-SUP-01]
entities:
  - entity: ENT-SUPPLIER
    ops: [C, R, U]
rules: []
events:
  emits: []
  consumes: []
depends_on: []
flows: [FLOW-005]
---

# Register supplier

## Summary and user story

As a buyer (PER-BUYER), I want to register a supplier, so that it can be checked and approved.

## Business value / problem

All suppliers are known in one place before anyone buys from them.

## Preconditions and triggers

The purchaser has the supplier's name and registration number.

## Main flow

1. On SCR-SUP-01, the purchaser uses action A01 Register.
2. They enter the name, registration number and contact person.
3. The supplier is saved as prospective.

## Alternative and exception flows

- The registration number is already registered: nothing is saved and the existing supplier is shown.

## Data in / data out

In: name, registration number, contact person. Out: a prospective supplier.

## Business rules applied

None.

## State transitions caused

None. A new supplier starts as prospective.

## Notifications

None.

## Permissions and data visibility

Purchasers register suppliers for the whole organisation.

## Acceptance criteria

### CAP-SUP-001-AC-01

- **Given** a registration number that is not registered
- **When** the purchaser registers the supplier
- **Then** the supplier is saved as prospective
- **Covers:** main flow step 3

## Out of scope

None.

## Open questions

None.
