---
id: CAP-CAT-005
title: "Activate article"
module: MOD-CAT
status: refined
version: 1
roles:
  - role: ROLE-CATALOG-MANAGER
    scope: org
screens: [SCR-CAT-01]
entities:
  - entity: ENT-ARTICLE
    ops: [R, U]
    transitions: [draft->active]
rules: [RULE-CAT-002]
events:
  emits: [EVT-ARTICLE-ACTIVATED]
  consumes: []
depends_on: [CAP-CAT-004]
flows: [FLOW-001]
---

# Activate article

## Summary and user story

As a catalog lead (PER-CATALOG-LEAD), I want to activate a complete article, so that it can be priced and sold.

## Business value / problem

Only complete articles reach pricing and sales staff.

## Preconditions and triggers

A draft article exists.

## Main flow

1. On SCR-CAT-01, the catalog manager opens a draft article and uses action A02 Activate.
2. The article is checked for completeness (RULE-CAT-002).
3. The article becomes active and pricing is told (EVT-ARTICLE-ACTIVATED).

## Alternative and exception flows

- Data is missing or archived: the article stays draft and the catalog manager sees what is missing.

## Data in / data out

In: the draft article. Out: the active article.

## Business rules applied

- RULE-CAT-002 — checked before activation.

## State transitions caused

ENT-ARTICLE draft -> active.

## Notifications

EVT-ARTICLE-ACTIVATED is emitted; pricing managers see the article as waiting for a sales price.

## Permissions and data visibility

Catalog managers activate any article.

## Acceptance criteria

### CAP-CAT-005-AC-01

- **Given** a draft article with a name, a category and a unit of measure
- **When** the catalog manager activates it
- **Then** the article is active
- **And** pricing is told the article was activated
- **Covers:** main flow step 3

### CAP-CAT-005-AC-02

- **Given** a draft article whose category is archived
- **When** the catalog manager activates it
- **Then** the article stays draft and the archived category is shown as the reason
- **Covers:** RULE-CAT-002

## Out of scope

None.

## Open questions

None.
