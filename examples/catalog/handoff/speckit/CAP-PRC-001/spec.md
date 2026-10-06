# Feature Specification: Propose sales price

**Feature Branch**: `001-propose-sales-price`  
**Created**: 2026-10-07  
**Status**: Draft  
**Input**: Product specification CAP-PRC-001 exported from alterspec (CAP-PRC-001 v1)

<!-- Exported by alterspec 0.1.0 from CAP-PRC-001 (CAP-PRC-001 v1). Edit the source spec, not this file. -->

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Propose sales price (Priority: P1)

As a pricing analyst (PER-PRICING-ANALYST), I want to propose a sales price for an article, so that it can be sold at a price that covers what we pay.

**Why this priority**: New articles and changed purchase prices get a sales price quickly, and never one below the purchase price.

**Independent Test**: Can be fully tested by completing the main flow: On SCR-PRC-01, the pricing manager opens an article waiting for a sales price; They see its valid purchase prices and its current sales price, if any; They use action A01 Propose and enter the amount and the valid-from date; The amount is checked against the highest valid purchase price (RULE-PRC-001); The sales price is saved as proposed and waits for approval.

**Acceptance Scenarios**:

1. **Given** an active article whose highest valid purchase price is 8.00, **When** the pricing manager proposes a sales price of 10.00, **Then** the sales price is saved as proposed *(CAP-PRC-001-AC-01)*
2. **Given** an active article whose highest valid purchase price is 8.00, **When** the pricing manager proposes a sales price of 7.50, **Then** nothing is saved and the pricing manager sees the purchase price of 8.00 *(CAP-PRC-001-AC-02)*
3. **Given** a discontinued article, **When** the pricing manager proposes a sales price, **Then** nothing is saved *(CAP-PRC-001-AC-03)*

---

### Edge Cases

- The amount is not higher than the highest valid purchase price: nothing is saved and the pricing manager sees the purchase price (RULE-PRC-001). *(CAP-PRC-001)*
- The article is no longer active: nothing is saved (RULE-001). *(CAP-PRC-001)*
- A proposed sales price already exists for the article: it is replaced by the new proposal. *(CAP-PRC-001)*

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the pricing manager (org scope) to propose a sales price for an article. *(CAP-PRC-001)*
- **FR-002**: System MUST enforce RULE-001 Only active articles are sold: An article can have a valid sales price, and be shown to sales staff, only while it is active. *(RULE-001)*
- **FR-003**: System MUST enforce RULE-PRC-001 Sales price covers the purchase price: A sales price must be higher than the highest valid purchase price of the same article. *(RULE-PRC-001)*
- **FR-004**: System MUST behave as decided for: [NEEDS CLARIFICATION: Do sales prices differ per customer group?]

### Key Entities *(include if feature involves data)*

- **Article**: Something the company sells. Sales staff only ever see active articles. Attributes: Article number, Name, Brand (optional), Category, Unit of measure, Description (optional). Lifecycle: draft → active, active → discontinued.
- **Purchase price**: What a supplier charges for one unit of measure of an article, from a given date. Attributes: Article, Supplier, Amount, Valid from. Lifecycle: proposed → valid, valid → expired.
- **Sales price**: What the company charges for one unit of measure of an article, from a given date. Attributes: Article, Amount, Valid from. Lifecycle: proposed → valid, valid → expired.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 3 acceptance scenario(s) of "Propose sales price" pass, so that it can be sold at a price that covers what we pay.

## Assumptions

- Out of scope: Prices per customer group (DEC-001). *(CAP-PRC-001)*
- Out of scope: Promotions and temporary discounts. *(CAP-PRC-001)*
- Roles and permission scopes follow the alterspec product specification (ROLE-PRICING-MANAGER).
