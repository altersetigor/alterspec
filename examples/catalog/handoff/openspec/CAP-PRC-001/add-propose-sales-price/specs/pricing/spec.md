## Purpose

Sales prices of articles: proposing them, approving them and expiring them. It makes sure a sales price is never below the purchase price. Discounts per customer are out of scope (see DEC-001).

## ADDED Requirements

### Requirement: Propose sales price

The system SHALL let the pricing manager propose a sales price for an article. It MUST enforce RULE-001 "Only active articles are sold": An article can have a valid sales price, and be shown to sales staff, only while it is active. It MUST enforce RULE-PRC-001 "Sales price covers the purchase price": A sales price must be higher than the highest valid purchase price of the same article.

<!-- alterspec: CAP-PRC-001 v1 -->

#### Scenario: CAP-PRC-001-AC-01

- **WHEN** the pricing manager proposes a sales price of 10.00, given an active article whose highest valid purchase price is 8.00
- **THEN** the sales price is saved as proposed

#### Scenario: CAP-PRC-001-AC-02

- **WHEN** the pricing manager proposes a sales price of 7.50, given an active article whose highest valid purchase price is 8.00
- **THEN** nothing is saved and the pricing manager sees the purchase price of 8.00

#### Scenario: CAP-PRC-001-AC-03

- **WHEN** the pricing manager proposes a sales price, given a discontinued article
- **THEN** nothing is saved
