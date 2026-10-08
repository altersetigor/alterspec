# MOD-PRC — Pricing

<!-- Exported by alterspec 0.4.1 from MOD-PRC (CAP-PRC-001 v1, CAP-PRC-002 v2, CAP-PRC-003 v1). Edit the source spec, not this file. -->

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

## CAP-PRC-002 — Approve sales price

Status: ready, version 2.

> As a pricing analyst (PER-PRICING-ANALYST), I want to approve a proposed sales price, so that sales staff use it from its valid-from date.

### Business value

No sales price reaches sales staff without a second look.

### Preconditions and triggers

A proposed sales price exists.

### Roles and permissions

- ROLE-PRICING-MANAGER (Pricing manager): org scope

### Data visibility

Pricing managers approve sales prices for all articles.

### Main flow

1. On SCR-PRC-01, the pricing manager opens a proposed sales price.
2. They use action A02 Approve.
3. The proposal is checked again against the purchase price (RULE-PRC-001).
4. It becomes valid; the previous valid sales price of the article expires.

### Alternative and exception flows

- A purchase price changed since the proposal and the amount no longer covers it: the approval is refused (RULE-PRC-001).
- The margin over the highest valid purchase price is below 10 percent: the approval is refused and the margin is shown (RULE-PRC-002).

### Data in / data out

In: the proposed sales price. Out: the valid sales price, the expired previous one.

### Business rules applied

- RULE-001 — the article must still be active.
- RULE-PRC-001 — checked again at approval, because purchase prices may have changed.
- RULE-PRC-002 — the margin is checked at approval.

### State transitions caused

ENT-SALES-PRICE proposed -> valid; the previous one valid -> expired.

### Notifications

None. Sales staff see the new price from its valid-from date.

### Acceptance criteria

- **CAP-PRC-002-AC-01**
  - Given a proposed sales price of 10.00 and a valid one of 9.00 for the same article
  - When the pricing manager approves the proposal
  - Then the price of 10.00 is valid
  - And the price of 9.00 is expired
  - Covers: main flow step 4
- **CAP-PRC-002-AC-02**
  - Given a proposed sales price of 10.00 and a purchase price that rose to 10.50 since
  - When the pricing manager approves the proposal
  - Then the approval is refused and the new purchase price is shown
  - Covers: RULE-PRC-001
- **CAP-PRC-002-AC-03**
  - Given a proposed sales price of 10.50 and a highest valid purchase price of 10.00
  - When the pricing manager approves the proposal
  - Then the approval is refused and the margin of 5 percent is shown
  - Covers: RULE-PRC-002

### Out of scope

- Approval by a second person (see open questions).

Depends on: CAP-PRC-001.

## CAP-PRC-003 — Expire sales prices of a discontinued article

Status: ready, version 1.

> As a pricing analyst (PER-PRICING-ANALYST), I want the sales prices of a discontinued article to expire, so that nobody quotes them.

### Business value

Discontinued articles disappear from price lookups the same day.

### Preconditions and triggers

An article was discontinued (EVT-ARTICLE-DISCONTINUED).

### Roles and permissions

- ROLE-PRICING-MANAGER (Pricing manager): org scope

### Data visibility

Pricing managers expire sales prices for all articles.

### Main flow

1. The article appears on SCR-PRC-01 with its valid and proposed sales prices.
2. The pricing manager uses action A03 Expire.
3. Its valid sales price expires and proposed ones are withdrawn.

### Alternative and exception flows

- The article has no valid sales price: it is removed from the list without changes.

### Data in / data out

In: the discontinued article. Out: expired sales prices.

### Business rules applied

- RULE-001 — a discontinued article has no valid sales price.

### State transitions caused

ENT-SALES-PRICE valid -> expired.

### Acceptance criteria

- **CAP-PRC-003-AC-01**
  - Given a discontinued article with a valid sales price
  - When the pricing manager expires its prices
  - Then the sales price is expired
  - And sales staff no longer see the article
  - Covers: RULE-001

## Flows

### FLOW-001 — New article to sellable

1. CAP-CAT-004 Create article (ROLE-CATALOG-MANAGER)
2. CAP-CAT-005 Activate article (ROLE-CATALOG-MANAGER)
3. CAP-SUP-004 Record purchase price (ROLE-PURCHASER)
4. **CAP-PRC-001 Propose sales price** (ROLE-PRICING-MANAGER)
5. **CAP-PRC-002 Approve sales price** (ROLE-PRICING-MANAGER)
6. CAP-GLB-001 Look up article prices (ROLE-SALES-STAFF)

### FLOW-002 — Supplier price update

1. CAP-SUP-005 Import supplier price list (ROLE-PURCHASER)
2. CAP-SUP-006 Approve purchase price (ROLE-PURCHASER)
3. **CAP-PRC-001 Propose sales price** (ROLE-PRICING-MANAGER)
4. **CAP-PRC-002 Approve sales price** (ROLE-PRICING-MANAGER)

### FLOW-004 — Discontinue article

1. CAP-CAT-006 Discontinue article (ROLE-CATALOG-MANAGER)
2. **CAP-PRC-003 Expire sales prices of a discontinued article** (ROLE-PRICING-MANAGER)

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
- **RULE-PRC-002 Sales prices keep a minimum margin:** A sales price must be at least 10 percent higher than the highest valid purchase price of the same article.

## Business events

- **EVT-ARTICLE-ACTIVATED Article activated**: An article became active. Pricing is told so a sales price can be proposed.
- **EVT-ARTICLE-DISCONTINUED Article discontinued**: An article will no longer be sold. Its valid sales prices must expire.
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
- CAP-PRC-002: Must the approver be a different person from the one who proposed the price?
