---
id: MOD-CAT
title: "Catalog"
status: refined
depends_on: []
---

# Catalog

## Description

Articles and the master data that describes them: brands, categories and units of measure. It decides when an article is ready to be sold. It does not cover stock or purchasing.

## Capabilities

<!-- GENERATED:start capabilities hash=bc5a2d34f54b -->
| Capability | Title | Status | Roles |
| --- | --- | --- | --- |
| [CAP-CAT-001](capabilities/CAP-CAT-001.md) | Maintain brands | refined | ROLE-CATALOG-MANAGER (org) |
| [CAP-CAT-002](capabilities/CAP-CAT-002.md) | Maintain categories | refined | ROLE-CATALOG-MANAGER (org) |
| [CAP-CAT-003](capabilities/CAP-CAT-003.md) | Maintain units of measure | refined | ROLE-CATALOG-MANAGER (org) |
| [CAP-CAT-004](capabilities/CAP-CAT-004.md) | Create article | refined | ROLE-CATALOG-MANAGER (org) |
| [CAP-CAT-005](capabilities/CAP-CAT-005.md) | Activate article | refined | ROLE-CATALOG-MANAGER (org) |
| [CAP-CAT-006](capabilities/CAP-CAT-006.md) | Discontinue article | refined | ROLE-CATALOG-MANAGER (org) |
<!-- GENERATED:end -->

## Role × capability matrix

<!-- GENERATED:start role-matrix hash=ba356f532b3c -->
| Capability | ROLE-CATALOG-MANAGER |
| --- | --- |
| [CAP-CAT-001](capabilities/CAP-CAT-001.md) | org |
| [CAP-CAT-002](capabilities/CAP-CAT-002.md) | org |
| [CAP-CAT-003](capabilities/CAP-CAT-003.md) | org |
| [CAP-CAT-004](capabilities/CAP-CAT-004.md) | org |
| [CAP-CAT-005](capabilities/CAP-CAT-005.md) | org |
| [CAP-CAT-006](capabilities/CAP-CAT-006.md) | org |
<!-- GENERATED:end -->

## Screens

<!-- GENERATED:start screens hash=e680806500e2 -->
| Screen | Title | Actions |
| --- | --- | --- |
| [SCR-CAT-01](screens/SCR-CAT-01.md) | Article record | A01 Create → CAP-CAT-004<br>A02 Activate → CAP-CAT-005<br>A03 Discontinue → CAP-CAT-006 |
| [SCR-CAT-02](screens/SCR-CAT-02.md) | Master data | A01 Units of measure → CAP-CAT-003<br>A02 Brands → CAP-CAT-001<br>A03 Categories → CAP-CAT-002 |
<!-- GENERATED:end -->
