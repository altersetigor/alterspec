---
id: APP
title: "Product Catalog"
status: refined
version: 1
channels:
  - name: Backoffice
    kind: backoffice
    audience: Catalog, purchasing and pricing staff
  - name: Sales desk
    kind: web
    audience: Sales staff looking up articles and prices
modules:
  - MOD-GLB
  - MOD-CAT
  - MOD-SUP
  - MOD-PRC
---

# Product Catalog

## Vision

One trusted place for every article the company sells: what it is, who supplies it, what it costs to buy and what
it sells for. Catalog, purchasing and pricing staff keep it right; sales staff rely on it.

## Problems solved

- Sales staff quote outdated or unapproved prices because prices live in spreadsheets (PER-SALES-REP).
- Articles go on sale before they are complete, with no unit of measure or category (PER-CATALOG-LEAD).
- Supplier price changes arrive by email and are applied late or not at all (PER-BUYER).
- Nobody sees when a sales price no longer covers the purchase price (PER-PRICING-ANALYST).

## Apps and channels

- **Backoffice** for catalog managers, purchasers and pricing managers.
- **Sales desk** for sales staff, who only look things up.
- Suppliers send price lists; they don't use the product themselves.

## Modules

- MOD-GLB — Shared: article search for everyone
- MOD-CAT — Catalog: articles, brands, categories and units of measure
- MOD-SUP — Suppliers: suppliers and the purchase prices they offer
- MOD-PRC — Pricing: sales prices and their approval

## High-level architecture

The catalog (MOD-CAT) owns articles and their master data. Suppliers (MOD-SUP) attach purchase prices to articles.
Pricing (MOD-PRC) turns purchase prices into approved sales prices. The shared search (MOD-GLB) shows active
articles with their valid sales price. Suppliers are the only external party: they send price lists.

## Related documents

- [Personas and roles](personas-roles.md)
- [Glossary](glossary.md)
- [Business rules](rules.md)
- [Events](events.md)
- [Integrations](integrations.md)
- [Non-functional requirements](nfr.md)
- [Decisions](decisions.md)
