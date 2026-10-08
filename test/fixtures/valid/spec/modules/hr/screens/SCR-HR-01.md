---
id: SCR-HR-01
title: Employee record
module: MOD-HR
status: draft
roles:
  - role: ROLE-HR-MANAGER
fields:
  - entity: ENT-EMPLOYEE
    attributes: [Full name, Start date, Contract type]
    mode: edit
actions:
  - id: A01
    label: Register
    capability: CAP-HR-001
  - id: A02
    label: Activate
    capability: CAP-HR-002
  - id: A03
    label: Record leaving
    capability: CAP-HR-003
---

# Employee record

## Purpose

Shows one employee and what can be done with the record.

## Business states

- **Empty:** a new employee with nothing filled in.
- **No permission:** other roles are told the record is for HR only.
- **Validation errors:** a missing full name or start date is named.

## Used by capabilities

<!-- GENERATED:start screen-capabilities hash=091aa6cf3174 -->
| Capability | Title | Via |
| --- | --- | --- |
| [CAP-HR-001](../capabilities/CAP-HR-001.md) | Register employee | listed by capability, action A01 |
| [CAP-HR-002](../capabilities/CAP-HR-002.md) | Activate employee | listed by capability, action A02 |
| [CAP-HR-003](../capabilities/CAP-HR-003.md) | Record employee leaving | listed by capability, action A03 |
<!-- GENERATED:end -->
