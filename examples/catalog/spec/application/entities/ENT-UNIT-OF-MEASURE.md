---
id: ENT-UNIT-OF-MEASURE
title: "Unit of measure"
status: refined
attributes:
  - name: Code
    kind: text
    required: true
    description: Short code such as PC or KG
  - name: Name
    kind: text
    required: true
relationships: []
states: [active, archived]
initial_state: active
transitions:
  - from: active
    to: archived
  - from: archived
    to: active
---

# Unit of measure

## Description

The quantity an article is bought and sold in.

## Attributes

The code is shown on price lists.

## Lifecycle

An archived unit of measure can no longer be chosen for new articles. It can be restored.

## Coverage

<!-- GENERATED:start entity-coverage hash=7263529c96b3 -->
| Capability | C | R | U | D | A | Transitions |
| --- | --- | --- | --- | --- | --- | --- |
| [CAP-CAT-003](../../modules/cat/capabilities/CAP-CAT-003.md) | ✓ | ✓ | ✓ |  | ✓ | active->archived, archived->active |
| [CAP-CAT-004](../../modules/cat/capabilities/CAP-CAT-004.md) |  | ✓ |  |  |  | — |

_No lifecycle gaps._
<!-- GENERATED:end -->
