---
id: CAP-CAT-004
title: "Create article"
module: MOD-CAT
status: refined
version: 1
roles:
  - role: ROLE-CATALOG-MANAGER
    scope: org
screens: [SCR-CAT-01]
entities:
  - entity: ENT-ARTICLE
    ops: [C, R, U]
  - entity: ENT-BRAND
    ops: [R]
  - entity: ENT-CATEGORY
    ops: [R]
  - entity: ENT-UNIT-OF-MEASURE
    ops: [R]
rules: [RULE-CAT-001]
events:
  emits: []
  consumes: []
depends_on: [CAP-CAT-002]
flows: [FLOW-001]
---

# Create article

## Summary and user story

As a catalog lead (PER-CATALOG-LEAD), I want to create an article, so that it can be prepared for sale.

## Business value / problem

Every article the company sells starts here, with one agreed article number.

## Preconditions and triggers

Brands, categories and units of measure exist (FLOW-003).

## Main flow

1. On SCR-CAT-01, the catalog manager uses action A01 Create.
2. They enter the article number, name, brand, category, unit of measure and description.
3. The article is saved as draft.

## Alternative and exception flows

- The article number is already used: nothing is saved and the catalog manager is told (RULE-CAT-001).
- The catalog manager saves without a category or unit of measure: the draft is kept, and the missing data is shown as needed before activation.

## Data in / data out

In: article number, name, brand, category, unit of measure, description. Out: a draft article.

## Business rules applied

- RULE-CAT-001 — the article number is checked before saving.

## State transitions caused

None. A new article starts as draft.

## Notifications

None.

## Permissions and data visibility

Catalog managers create articles for the whole organisation. Draft articles are not visible to sales staff.

## Acceptance criteria

### CAP-CAT-004-AC-01

- **Given** an article number that no article uses
- **When** the catalog manager creates an article with it
- **Then** the article is saved as draft
- **Covers:** main flow step 3

### CAP-CAT-004-AC-02

- **Given** an article number used by a discontinued article
- **When** the catalog manager creates an article with it
- **Then** nothing is saved and the catalog manager is told the number is taken
- **Covers:** RULE-CAT-001

## Out of scope

- Article pictures and marketing texts.

## Open questions

None.
