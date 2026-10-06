---
id: ENT-PURCHASE-PRICE
title: "Purchase price"
status: refined
attributes:
  - name: Article
    kind: reference
    required: true
  - name: Supplier
    kind: reference
    required: true
  - name: Amount
    kind: amount
    required: true
  - name: Valid from
    kind: date
    required: true
relationships:
  - entity: ENT-ARTICLE
    cardinality: one
  - entity: ENT-SUPPLIER
    cardinality: one
states: [proposed, valid, expired]
initial_state: proposed
transitions:
  - from: proposed
    to: valid
  - from: valid
    to: expired
---

# Purchase price

## Description

What a supplier charges for one unit of measure of an article, from a given date.

## Attributes

The amount is per unit of measure of the article.

## Lifecycle

A proposed price becomes valid when a purchaser approves it. The previous valid price of the same supplier and article then expires.

## Coverage

<!-- GENERATED:start entity-coverage hash=43b1cb232cd2 -->
| Capability | C | R | U | D | A | Transitions |
| --- | --- | --- | --- | --- | --- | --- |
| [CAP-PRC-001](../../modules/prc/capabilities/CAP-PRC-001.md) |  | ✓ |  |  |  | — |
| [CAP-SUP-004](../../modules/sup/capabilities/CAP-SUP-004.md) | ✓ | ✓ | ✓ |  |  | — |
| [CAP-SUP-005](../../modules/sup/capabilities/CAP-SUP-005.md) | ✓ | ✓ |  |  |  | — |
| [CAP-SUP-006](../../modules/sup/capabilities/CAP-SUP-006.md) |  | ✓ | ✓ |  | ✓ | proposed->valid, valid->expired |

_No lifecycle gaps._
<!-- GENERATED:end -->
