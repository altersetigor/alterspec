---
id: ENT-SALES-PRICE
title: "Sales price"
status: refined
attributes:
  - name: Article
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
states: [proposed, valid, expired]
initial_state: proposed
transitions:
  - from: proposed
    to: valid
  - from: valid
    to: expired
---

# Sales price

## Description

What the company charges for one unit of measure of an article, from a given date.

## Attributes

One valid sales price per article at a time (see DEC-001).

## Lifecycle

A proposed price becomes valid when a pricing manager approves it. The previous valid price then expires. Prices of a discontinued article expire too.

## Coverage

<!-- GENERATED:start entity-coverage hash=981fce68cf23 -->
| Capability | C | R | U | D | A | Transitions |
| --- | --- | --- | --- | --- | --- | --- |
| [CAP-GLB-001](../../modules/glb/capabilities/CAP-GLB-001.md) |  | ✓ |  |  |  | — |
| [CAP-PRC-001](../../modules/prc/capabilities/CAP-PRC-001.md) | ✓ | ✓ | ✓ |  |  | — |
| [CAP-PRC-002](../../modules/prc/capabilities/CAP-PRC-002.md) |  | ✓ | ✓ |  | ✓ | proposed->valid, valid->expired |
| [CAP-PRC-003](../../modules/prc/capabilities/CAP-PRC-003.md) |  | ✓ | ✓ |  | ✓ | valid->expired |

_No lifecycle gaps._
<!-- GENERATED:end -->
