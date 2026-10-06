---
id: ENT-BRAND
title: "Brand"
status: refined
attributes:
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

# Brand

## Description

The name under which a manufacturer markets articles.

## Attributes

Only the name is kept.

## Lifecycle

An archived brand can no longer be chosen for new articles. It can be restored.

## Coverage

<!-- GENERATED:start entity-coverage hash=ec410ad99cc5 -->
| Capability | C | R | U | D | A | Transitions |
| --- | --- | --- | --- | --- | --- | --- |
| [CAP-CAT-001](../../modules/cat/capabilities/CAP-CAT-001.md) | ✓ | ✓ | ✓ |  | ✓ | active->archived, archived->active |
| [CAP-CAT-004](../../modules/cat/capabilities/CAP-CAT-004.md) |  | ✓ |  |  |  | — |

_No lifecycle gaps._
<!-- GENERATED:end -->
