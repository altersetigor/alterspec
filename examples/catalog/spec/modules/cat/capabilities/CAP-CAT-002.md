---
id: CAP-CAT-002
title: "Maintain categories"
module: MOD-CAT
status: refined
version: 1
roles:
  - role: ROLE-CATALOG-MANAGER
    scope: org
screens: [SCR-CAT-02]
entities:
  - entity: ENT-CATEGORY
    ops: [C, R, U, A]
    transitions: [active->archived, archived->active]
rules: []
events:
  emits: []
  consumes: []
depends_on: [CAP-CAT-001]
flows: [FLOW-003]
---

# Maintain categories

## Summary and user story

As a catalog lead (PER-CATALOG-LEAD), I want to maintain the list of categorys, so that articles are described consistently.

## Business value / problem

Duplicate or misspelled categorys make the catalog hard to browse and to report on.

## Preconditions and triggers

The catalog manager opens the master data screen.

## Main flow

1. On SCR-CAT-02, the catalog manager uses action A03 and sees the categorys.
2. They add a category, rename one, archive one that is no longer used, or restore an archived one.
3. The change is saved.

## Alternative and exception flows

- The name is already used by another category: nothing is saved and the catalog manager is told.

## Data in / data out

In: the category name. Out: the list of categorys with their state.

## Business rules applied

None.

## State transitions caused

ENT-CATEGORY active -> archived, and archived -> active.

## Notifications

None.

## Permissions and data visibility

Catalog managers maintain all categorys. Everyone else only sees active ones when choosing for an article.

## Acceptance criteria

### CAP-CAT-002-AC-01

- **Given** an active category that no draft or active article uses
- **When** the catalog manager archives it
- **Then** it can no longer be chosen for new articles
- **Covers:** main flow step 2

### CAP-CAT-002-AC-02

- **Given** a category name that is already used
- **When** the catalog manager adds a category with that name
- **Then** nothing is saved and the catalog manager is told why
- **Covers:** alternative flow

## Out of scope

- Importing master data in bulk.

## Open questions

None.
