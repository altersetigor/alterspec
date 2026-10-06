---
status: draft
inputDocuments: ["alterspec CAP-PRC-001 v1"]
exportedBy: "alterspec 0.2.1"
---

# Product Catalog - Epic Breakdown

## Overview

This document breaks CAP-PRC-001 (Propose sales price) from the alterspec product specification into an epic and stories. Edit the source spec, not this file.

## Requirements Inventory

### Functional Requirements

FR1: the pricing manager can propose a sales price for an article. (CAP-PRC-001)

### NonFunctional Requirements

None in this export.

### Additional Requirements

- RULE-001 Only active articles are sold: An article can have a valid sales price, and be shown to sales staff, only while it is active.
- RULE-PRC-001 Sales price covers the purchase price: A sales price must be higher than the highest valid purchase price of the same article.

### UX Design Requirements

- SCR-PRC-01 Sales price review: Work through articles that need a sales price, proposals that need approval, and discontinued articles whose prices must expire. Actions: Propose, Approve, Expire.

### FR Coverage Map

FR1: Epic 1 - Story 1.1

## Epic List

## Epic 1: Pricing

Sales prices of articles: proposing them, approving them and expiring them. It makes sure a sales price is never below the purchase price. Discounts per customer are out of scope (see DEC-001).

### Story 1.1: Propose sales price

<!-- alterspec: CAP-PRC-001 v1 -->

As a pricing analyst (PER-PRICING-ANALYST),
I want to propose a sales price for an article,
So that it can be sold at a price that covers what we pay.

**Acceptance Criteria:**

<!-- CAP-PRC-001-AC-01 -->
**Given** an active article whose highest valid purchase price is 8.00
**When** the pricing manager proposes a sales price of 10.00
**Then** the sales price is saved as proposed

<!-- CAP-PRC-001-AC-02 -->
**Given** an active article whose highest valid purchase price is 8.00
**When** the pricing manager proposes a sales price of 7.50
**Then** nothing is saved and the pricing manager sees the purchase price of 8.00

<!-- CAP-PRC-001-AC-03 -->
**Given** a discontinued article
**When** the pricing manager proposes a sales price
**Then** nothing is saved

Business rule RULE-001: An article can have a valid sales price, and be shown to sales staff, only while it is active.

Business rule RULE-PRC-001: A sales price must be higher than the highest valid purchase price of the same article.
