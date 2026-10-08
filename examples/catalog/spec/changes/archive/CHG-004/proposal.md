---
id: CHG-004
title: "Sales price review as a working app"
status: applied # draft | in_review | approved | applied | rejected
created: 2026-10-08
removes:
  - file:experience/mockups/nav.js
  - file:experience/mockups/kit/shell.js
# `base` and `approved_hash` are written by the alterspec CLI. Don't edit them.
base:
  file:experience/mockups/kit/tokens.css: a54e14849b764412
  file:experience/mockups/kit/components.css: 494e48cad4c3ca83
  file:experience/mockups/kit/icons.js: null
  file:experience/mockups/kit/store.js: null
  file:experience/mockups/kit/ui.js: null
  file:experience/mockups/kit/app.js: null
  file:experience/mockups/config.js: null
  file:experience/mockups/data.js: null
  file:experience/mockups/index.html: c9eb41c141f4377d
  file:experience/mockups/nav.js: e43ac7329202a777
  file:experience/mockups/kit/shell.js: 0d880c2e70994862
  file:experience/mockups/SCR-PRC-01.html: 4b8fd80b30db7c42
  UX-SCR-PRC-01: a39546a98eff97d8
approved_hash: e3a16d0b5f6f590c
applied: 2026-10-08
---

# Sales price review as a working app

<!--
A change to the product and its spec. The objects it adds or modifies live in spec/ next to this file,
at the same paths as in the main spec/. Use `alterspec change edit` / `alterspec new ... --change` to add them,
and `alterspec change remove` for removals.
-->

## Why

<!-- The business reason for the change. -->

Stakeholders should try the sales price review the way it will work: signed in as a pricing manager, with data
that changes when they act.

## What changes

<!-- Summary of added, modified and removed capabilities, screens, rules and entities. -->

- Moves the mockups onto the application runtime: sign-in page, demo people, demo data, and pages that read and
  change it.
- Rebuilds the sales price review page from UX-SCR-PRC-01 on the new runtime.

No business object changes.

## Open questions
