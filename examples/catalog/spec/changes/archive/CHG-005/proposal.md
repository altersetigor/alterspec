---
id: CHG-005
title: "Product profile"
status: applied # draft | in_review | approved | applied | rejected
created: 2026-10-09
removes: []
# `base` and `approved_hash` are written by the alterspec CLI. Don't edit them.
base:
  APP: 4dcee37e5241c0d2
approved_hash: 688e11ed8421791f
applied: 2026-10-09
---

# Product profile

<!--
A change to the product and its spec. The objects it adds or modifies live in spec/ next to this file,
at the same paths as in the main spec/. Use `alterspec change edit` / `alterspec new ... --change` to add them,
and `alterspec change remove` for removals.
-->

## Why

<!-- The business reason for the change. -->

The spec never said whether the catalog serves one company or many, in which languages and currencies, or whether
the sales desk must work on a phone. Each new capability risked specifying translation or currency conversion the
product doesn't need.

## What changes

<!-- Summary of added, modified and removed capabilities, screens, rules and entities. -->

- Records the product profile on APP: one company (single tenancy), English only, US dollars only, one time zone.
- Marks the Sales desk channel as responsive: sales staff look prices up on tablets at the counter.

No capability, screen, rule or entity changes.

## Open questions
