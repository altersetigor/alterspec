---
id: SCR-SUP-01
title: "Supplier record"
module: MOD-SUP
status: refined
roles:
  - role: ROLE-PURCHASER
entry_points: []
actions:
  - id: A01
    label: Register
    capability: CAP-SUP-001
  - id: A02
    label: Approve
    capability: CAP-SUP-002
  - id: A03
    label: Block
    capability: CAP-SUP-003
mockups: []
---

# Supplier record

## Purpose

Register suppliers and manage whether they may offer prices.

## Entry points

Main menu.

## Displayed data

Supplier name, registration number, contact person and state, with the reason for a block.

## Actions

- A01 Register → CAP-SUP-001
- A02 Approve → CAP-SUP-002
- A03 Block → CAP-SUP-003

## Per-role differences

Only purchasers see this screen.

## Business states

- **Empty:** no suppliers yet.
- **No permission:** other roles cannot open it.
- **Validation errors:** a registration number already registered.

## Used by capabilities

<!-- GENERATED:start screen-capabilities hash=47a0cc357b38 -->
| Capability | Title | Via |
| --- | --- | --- |
| [CAP-SUP-001](../capabilities/CAP-SUP-001.md) | Register supplier | listed by capability, action A01 |
| [CAP-SUP-002](../capabilities/CAP-SUP-002.md) | Approve supplier | listed by capability, action A02 |
| [CAP-SUP-003](../capabilities/CAP-SUP-003.md) | Block supplier | listed by capability, action A03 |
<!-- GENERATED:end -->
