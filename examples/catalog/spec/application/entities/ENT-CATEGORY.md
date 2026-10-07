---
id: ENT-CATEGORY
title: "Category"
status: refined
attributes:
  - name: Name
    kind: text
    required: true
  - name: Parent category
    kind: reference
    required: false
    description: Categories can be nested
    references: ENT-CATEGORY
relationships:
  - entity: ENT-CATEGORY
    cardinality: one
states: [active, archived]
initial_state: active
transitions:
  - from: active
    to: archived
  - from: archived
    to: active
---

# Category

## Description

A group of similar articles, used to browse and to report.

## Attributes

A category may sit inside a parent category.

## Lifecycle

An archived category can no longer be chosen for new articles. It can be restored.

## Coverage

<!-- GENERATED:start entity-coverage hash=c7007842dd00 -->
| Capability | C | R | U | D | A | Transitions |
| --- | --- | --- | --- | --- | --- | --- |
| [CAP-CAT-002](../../modules/cat/capabilities/CAP-CAT-002.md) | ✓ | ✓ | ✓ |  | ✓ | active->archived, archived->active |
| [CAP-CAT-004](../../modules/cat/capabilities/CAP-CAT-004.md) |  | ✓ |  |  |  | — |

_No lifecycle gaps._
<!-- GENERATED:end -->
