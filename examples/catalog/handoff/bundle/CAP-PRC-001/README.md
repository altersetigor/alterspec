# CAP-PRC-001 — Propose sales price

<!-- Exported by alterspec 0.4.1 from CAP-PRC-001 (CAP-PRC-001 v1). Edit the source spec, not this file. -->

Self-contained product specification exported from alterspec on 2026-10-07. It describes what the product does and why, in business terms; technical design decisions are made from here on.

**Application:** Product Catalog  
**Module:** MOD-PRC — Pricing

Sales prices of articles: proposing them, approving them and expiring them. It makes sure a sales price is never below the purchase price. Discounts per customer are out of scope (see DEC-001).

## CAP-PRC-001 — Propose sales price

Status: ready, version 1.

> As a pricing analyst (PER-PRICING-ANALYST), I want to propose a sales price for an article, so that it can be sold at a price that covers what we pay.

### Business value

New articles and changed purchase prices get a sales price quickly, and never one below the purchase price.

### Preconditions and triggers

An article was activated (EVT-ARTICLE-ACTIVATED) or one of its purchase prices changed (EVT-PURCHASE-PRICE-CHANGED). The article appears on SCR-PRC-01 as waiting for a sales price.

### Roles and permissions

- ROLE-PRICING-MANAGER (Pricing manager): org scope

### Data visibility

Pricing managers propose sales prices for all articles. Sales staff never see proposed prices.

### Main flow

1. On SCR-PRC-01, the pricing manager opens an article waiting for a sales price.
2. They see its valid purchase prices and its current sales price, if any.
3. They use action A01 Propose and enter the amount and the valid-from date.
4. The amount is checked against the highest valid purchase price (RULE-PRC-001).
5. The sales price is saved as proposed and waits for approval.

### Alternative and exception flows

- The amount is not higher than the highest valid purchase price: nothing is saved and the pricing manager sees the purchase price (RULE-PRC-001).
- The article is no longer active: nothing is saved (RULE-001).
- A proposed sales price already exists for the article: it is replaced by the new proposal.

### Data in / data out

In: article, amount, valid-from date. Shown: valid purchase prices, current sales price. Out: a proposed sales price.

### Business rules applied

- RULE-001 — only active articles get a sales price.
- RULE-PRC-001 — the amount must be higher than the highest valid purchase price.

### State transitions caused

None. A new sales price starts as proposed.

### Notifications

None. The proposal appears on SCR-PRC-01 for approval.

### Acceptance criteria

- **CAP-PRC-001-AC-01**
  - Given an active article whose highest valid purchase price is 8.00
  - When the pricing manager proposes a sales price of 10.00
  - Then the sales price is saved as proposed
  - Covers: main flow step 5
- **CAP-PRC-001-AC-02**
  - Given an active article whose highest valid purchase price is 8.00
  - When the pricing manager proposes a sales price of 7.50
  - Then nothing is saved and the pricing manager sees the purchase price of 8.00
  - Covers: RULE-PRC-001
- **CAP-PRC-001-AC-03**
  - Given a discontinued article
  - When the pricing manager proposes a sales price
  - Then nothing is saved
  - Covers: RULE-001

### Out of scope

- Prices per customer group (DEC-001).
- Promotions and temporary discounts.

## Flows

### FLOW-001 — New article to sellable

1. CAP-CAT-004 Create article (ROLE-CATALOG-MANAGER)
2. CAP-CAT-005 Activate article (ROLE-CATALOG-MANAGER)
3. CAP-SUP-004 Record purchase price (ROLE-PURCHASER)
4. **CAP-PRC-001 Propose sales price** (ROLE-PRICING-MANAGER)
5. CAP-PRC-002 Approve sales price (ROLE-PRICING-MANAGER)
6. CAP-GLB-001 Look up article prices (ROLE-SALES-STAFF)

### FLOW-002 — Supplier price update

1. CAP-SUP-005 Import supplier price list (ROLE-PURCHASER)
2. CAP-SUP-006 Approve purchase price (ROLE-PURCHASER)
3. **CAP-PRC-001 Propose sales price** (ROLE-PRICING-MANAGER)
4. CAP-PRC-002 Approve sales price (ROLE-PRICING-MANAGER)

## Business entities

### ENT-ARTICLE — Article

Something the company sells. Sales staff only ever see active articles.

| Attribute | Kind | Required | Description |
| --- | --- | --- | --- |
| Article number | text | yes | Unique, never reused |
| Name | text | yes |  |
| Brand | reference | no |  |
| Category | reference | yes |  |
| Unit of measure | reference | yes | The unit it is sold in |
| Description | text | no |  |

Lifecycle: draft → active, active → discontinued (starts as draft).

Relationships: one ENT-BRAND, one ENT-CATEGORY, one ENT-UNIT-OF-MEASURE.

### ENT-PURCHASE-PRICE — Purchase price

What a supplier charges for one unit of measure of an article, from a given date.

| Attribute | Kind | Required | Description |
| --- | --- | --- | --- |
| Article | reference | yes |  |
| Supplier | reference | yes |  |
| Amount | amount | yes |  |
| Valid from | date | yes |  |

Lifecycle: proposed → valid, valid → expired (starts as proposed).

Relationships: one ENT-ARTICLE, one ENT-SUPPLIER.

### ENT-SALES-PRICE — Sales price

What the company charges for one unit of measure of an article, from a given date.

| Attribute | Kind | Required | Description |
| --- | --- | --- | --- |
| Article | reference | yes |  |
| Amount | amount | yes |  |
| Valid from | date | yes |  |

Lifecycle: proposed → valid, valid → expired (starts as proposed).

Relationships: one ENT-ARTICLE.

## Business rules

- **RULE-001 Only active articles are sold:** An article can have a valid sales price, and be shown to sales staff, only while it is active.
- **RULE-PRC-001 Sales price covers the purchase price:** A sales price must be higher than the highest valid purchase price of the same article.

## Business events

- **EVT-ARTICLE-ACTIVATED Article activated**: An article became active. Pricing is told so a sales price can be proposed.
- **EVT-PURCHASE-PRICE-CHANGED Purchase price changed**: A new purchase price became valid. Pricing checks whether the sales price still covers it.

## Screens

### SCR-PRC-01 — Sales price review

Work through articles that need a sales price, proposals that need approval, and discontinued articles whose prices must expire.

- Shows ENT-PURCHASE-PRICE Purchase price (list): Supplier, Amount, Valid from
- Shows ENT-SALES-PRICE Sales price (edit): Article, Amount, Valid from
- A01 Propose → CAP-PRC-001
- A02 Approve → CAP-PRC-002
- A03 Expire → CAP-PRC-003

**Experience (ready):** list layout. The contract is [UX-SCR-PRC-01](experience/screens/UX-SCR-PRC-01.md); the mockup is [experience/mockups/SCR-PRC-01.html](experience/mockups/SCR-PRC-01.html), built to match it exactly. States:

- [default as ROLE-PRICING-MANAGER](experience/mockups/SCR-PRC-01.html?as=ROLE-PRICING-MANAGER)
- [empty as ROLE-PRICING-MANAGER](experience/mockups/SCR-PRC-01.html?as=ROLE-PRICING-MANAGER&state=empty)
- [no-permission](experience/mockups/SCR-PRC-01.html?state=no-permission)
- [validation as ROLE-PRICING-MANAGER](experience/mockups/SCR-PRC-01.html?as=ROLE-PRICING-MANAGER&state=validation)

A clickable prototype of these screens, with made-up data, is in `prototype/index.html`.

The experience contracts and mockups in `experience/` are binding: they say how each screen looks and behaves, and they were checked element by element against this specification.

## Roles

- **ROLE-PRICING-MANAGER Pricing manager:** Proposes and approves sales prices. Held by PER-PRICING-ANALYST.

## Personas

- **PER-PRICING-ANALYST Pricing analyst:** **Goals:** sales prices that cover the purchase price and are approved before anyone uses them. **Pain points:** learns about purchase price increases weeks later.

## Glossary

- **Article:** Something the company sells, identified by its article number. (not: item)
- **Purchase price:** What a supplier charges for one unit of measure of an article, from a given date. (not: cost price)
- **Sales price:** What the company charges for one unit of measure of an article, from a given date, once approved. (not: selling price)

## Open questions

- DEC-001 Do sales prices differ per customer group? — **Context:** Some customers get better prices today, agreed outside any system. Until this is decided, an article has one valid sales price at a time.
