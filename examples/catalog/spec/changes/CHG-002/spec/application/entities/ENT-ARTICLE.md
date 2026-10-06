---
id: ENT-ARTICLE
title: "Article"
status: refined
attributes:
  - name: Article number
    kind: text
    required: true
    description: Unique, never reused
  - name: Name
    kind: text
    required: true
  - name: Brand
    kind: reference
    required: false
  - name: Category
    kind: reference
    required: true
  - name: Unit of measure
    kind: reference
    required: true
    description: The unit it is sold in
  - name: Description
    kind: text
    required: false
  - name: Replacement article
    kind: reference
    required: false
    description: The article to offer instead, once discontinued
relationships:
  - entity: ENT-BRAND
    cardinality: one
  - entity: ENT-CATEGORY
    cardinality: one
  - entity: ENT-UNIT-OF-MEASURE
    cardinality: one
  - entity: ENT-ARTICLE
    cardinality: one
states: [draft, active, discontinued]
initial_state: draft
transitions:
  - from: draft
    to: active
  - from: active
    to: discontinued
---

# Article

## Description

Something the company sells. Sales staff only ever see active articles.

## Attributes

The article number is chosen by the catalog manager and is unique across all articles, including discontinued ones (RULE-CAT-001).

## Lifecycle

- **draft**: being prepared; not visible to sales staff.
- **active**: complete and sellable (RULE-CAT-002).
- **discontinued**: no longer sold; kept for history.

## Coverage

<!-- GENERATED:start entity-coverage hash=4be858cbe2ef -->
| Capability | C | R | U | D | A | Transitions |
| --- | --- | --- | --- | --- | --- | --- |
| [CAP-CAT-004](../../modules/cat/capabilities/CAP-CAT-004.md) | ✓ | ✓ | ✓ |  |  | — |
| [CAP-CAT-005](../../modules/cat/capabilities/CAP-CAT-005.md) |  | ✓ | ✓ |  |  | draft->active |
| [CAP-CAT-006](../../modules/cat/capabilities/CAP-CAT-006.md) |  | ✓ | ✓ |  | ✓ | active->discontinued |
| [CAP-GLB-001](../../modules/glb/capabilities/CAP-GLB-001.md) |  | ✓ |  |  |  | — |
| [CAP-PRC-001](../../modules/prc/capabilities/CAP-PRC-001.md) |  | ✓ |  |  |  | — |
| [CAP-SUP-004](../../modules/sup/capabilities/CAP-SUP-004.md) |  | ✓ |  |  |  | — |
| [CAP-SUP-005](../../modules/sup/capabilities/CAP-SUP-005.md) |  | ✓ |  |  |  | — |

_No lifecycle gaps._
<!-- GENERATED:end -->
