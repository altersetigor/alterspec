---
id: CHG-001
title: "Minimum margin on sales prices"
status: applied # draft | in_review | approved | applied | rejected
created: 2026-10-06
removes: []
# `base` and `approved_hash` are written by the alterspec CLI. Don't edit them.
base:
  RULE-PRC-002: null
  CAP-PRC-002: 432117fec301b237
approved_hash: 86ab9b1a31b215be
applied: 2026-10-06
---

# Minimum margin on sales prices

<!--
A change to the product and its spec. The objects it adds or modifies live in spec/ next to this file,
at the same paths as in the main spec/. Use `alterspec change edit` / `alterspec new ... --change` to add them,
and `alterspec change remove` for removals.
-->

## Why

Sales prices that only just cover the purchase price leave no room for transport and handling. Finance asked for a minimum margin.

## What changes

- Adds RULE-PRC-002: a sales price keeps at least a 10 percent margin over the purchase price.
- CAP-PRC-002 Approve sales price checks the margin and refuses approval below it.

## Open questions
