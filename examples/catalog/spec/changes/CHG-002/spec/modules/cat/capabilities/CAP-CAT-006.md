---
id: CAP-CAT-006
title: "Discontinue article"
module: MOD-CAT
status: refined
version: 1
roles:
  - role: ROLE-CATALOG-MANAGER
    scope: org
screens: [SCR-CAT-01]
entities:
  - entity: ENT-ARTICLE
    ops: [R, U, A]
    transitions: [active->discontinued]
rules: []
events:
  emits: [EVT-ARTICLE-DISCONTINUED]
  consumes: []
depends_on: [CAP-CAT-005]
flows: [FLOW-004]
---

# Discontinue article

## Summary and user story

As a catalog lead (PER-CATALOG-LEAD), I want to discontinue an article, so that it is no longer sold.

## Business value / problem

Sales staff stop offering articles the company no longer sells.

## Preconditions and triggers

An active article exists.

## Main flow

1. On SCR-CAT-01, the catalog manager opens an active article and uses action A03 Discontinue.
2. They choose a replacement article, if there is one, and confirm.
3. The article is discontinued and pricing is told (EVT-ARTICLE-DISCONTINUED).

## Alternative and exception flows

None.

## Data in / data out

In: the active article. Out: the discontinued article.

## Business rules applied

None.

## State transitions caused

ENT-ARTICLE active -> discontinued.

## Notifications

EVT-ARTICLE-DISCONTINUED is emitted so its sales prices expire (CAP-PRC-003).

## Permissions and data visibility

Catalog managers discontinue any article.

## Acceptance criteria

### CAP-CAT-006-AC-01

- **Given** an active article
- **When** the catalog manager discontinues it
- **Then** the article is discontinued and no longer shown to sales staff
- **Covers:** main flow step 3

### CAP-CAT-006-AC-02

- **Given** an active article and another active article
- **When** the catalog manager discontinues the first and chooses the second as replacement
- **Then** the first article is discontinued and points to the replacement
- **Covers:** main flow step 2

## Out of scope

- Selling off remaining stock.

## Open questions

None.
