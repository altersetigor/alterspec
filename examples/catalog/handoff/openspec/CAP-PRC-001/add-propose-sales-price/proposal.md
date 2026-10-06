# Proposal

<!-- Exported by alterspec 0.0.1 from CAP-PRC-001 (CAP-PRC-001 v1). Edit the source spec, not this file. -->

## Why

New articles and changed purchase prices get a sales price quickly, and never one below the purchase price.

## What Changes

- Propose sales price: As a pricing analyst (PER-PRICING-ANALYST), I want to propose a sales price for an article, so that it can be sold at a price that covers what we pay.

## Capabilities

### New Capabilities

- `pricing`: Pricing — Sales prices of articles: proposing them, approving them and expiring them. It makes sure a sales price is never below the purchase price. Discounts per customer are out of scope (see DEC-001).

### Modified Capabilities

- None.

## Impact

- Roles: Pricing manager (ROLE-PRICING-MANAGER)
- Business entities: Article, Purchase price and Sales price
- Flow FLOW-001 New article to sellable: step 4
- Flow FLOW-002 Supplier price update: step 3
- Open questions: DEC-001 Do sales prices differ per customer group?
