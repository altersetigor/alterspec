---
id: CHG-002
title: "Article replacement on discontinuation"
status: in_review # draft | in_review | approved | applied | rejected
created: 2026-10-06
removes: []
# `base` and `approved_hash` are written by the alterspec CLI. Don't edit them.
base:
  ENT-ARTICLE: 1afe3d222337bbb8
  CAP-CAT-006: 7a10adbdb7c29a66
---

# Article replacement on discontinuation

<!--
A change to the product and its spec. The objects it adds or modifies live in spec/ next to this file,
at the same paths as in the main spec/. Use `alterspec change edit` / `alterspec new ... --change` to add them,
and `alterspec change remove` for removals.
-->

## Why

Sales staff lose the sale when a discontinued article has a successor they don't know about.

## What changes

- ENT-ARTICLE gets an optional replacement article.
- CAP-CAT-006 Discontinue article lets the catalog manager choose it.

## Open questions
