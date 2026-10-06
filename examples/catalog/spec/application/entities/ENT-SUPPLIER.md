---
id: ENT-SUPPLIER
title: "Supplier"
status: refined
attributes:
  - name: Name
    kind: text
    required: true
  - name: Registration number
    kind: text
    required: true
  - name: Contact person
    kind: text
    required: false
relationships: []
states: [prospective, approved, blocked]
initial_state: prospective
transitions:
  - from: prospective
    to: approved
  - from: approved
    to: blocked
  - from: blocked
    to: approved
---

# Supplier

## Description

A company the organisation buys articles from.

## Attributes

The registration number identifies the company.

## Lifecycle

- **prospective**: registered, not yet checked.
- **approved**: may offer purchase prices (RULE-SUP-001).
- **blocked**: no new purchase prices are accepted; can be approved again.

## Coverage

<!-- GENERATED:start entity-coverage hash=f330624dd9fd -->
| Capability | C | R | U | D | A | Transitions |
| --- | --- | --- | --- | --- | --- | --- |
| [CAP-SUP-001](../../modules/sup/capabilities/CAP-SUP-001.md) | ✓ | ✓ | ✓ |  |  | — |
| [CAP-SUP-002](../../modules/sup/capabilities/CAP-SUP-002.md) |  | ✓ | ✓ |  |  | prospective->approved |
| [CAP-SUP-003](../../modules/sup/capabilities/CAP-SUP-003.md) |  | ✓ | ✓ |  | ✓ | approved->blocked, blocked->approved |
| [CAP-SUP-004](../../modules/sup/capabilities/CAP-SUP-004.md) |  | ✓ |  |  |  | — |
| [CAP-SUP-005](../../modules/sup/capabilities/CAP-SUP-005.md) |  | ✓ |  |  |  | — |

_No lifecycle gaps._
<!-- GENERATED:end -->
