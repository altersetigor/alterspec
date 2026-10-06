---
id: CAP-SUP-005
title: "Import supplier price list"
module: MOD-SUP
status: refined
version: 1
roles:
  - role: ROLE-PURCHASER
    scope: org
screens: [SCR-SUP-02]
entities:
  - entity: ENT-PURCHASE-PRICE
    ops: [C, R]
  - entity: ENT-SUPPLIER
    ops: [R]
  - entity: ENT-ARTICLE
    ops: [R]
rules: [RULE-SUP-001]
events:
  emits: []
  consumes: [EVT-SUPPLIER-PRICE-LIST-RECEIVED]
depends_on: []
flows: [FLOW-002]
---

# Import supplier price list

## Summary and user story

As a buyer (PER-BUYER), I want to take over a supplier's price list, so that I don't type prices in by hand.

## Business value / problem

Supplier price changes are applied the day they arrive.

## Preconditions and triggers

An approved supplier sends a price list (EVT-SUPPLIER-PRICE-LIST-RECEIVED).

## Main flow

1. On SCR-SUP-02, the purchaser uses action A02 Import and chooses the supplier and the price list.
2. Each line is matched to an article by article number.
3. The purchaser reviews the matched lines and confirms.
4. A proposed purchase price is saved for each confirmed line.

## Alternative and exception flows

- A line names an unknown article number: the line is skipped and listed for the purchaser.
- The supplier is not approved: the whole list is refused (RULE-SUP-001).

## Data in / data out

In: the supplier and its price list. Out: proposed purchase prices, and a list of skipped lines.

## Business rules applied

- RULE-SUP-001 — the supplier must be approved.

## State transitions caused

None.

## Notifications

The purchaser sees the skipped lines at the end.

## Permissions and data visibility

Purchasers import price lists for all suppliers.

## Acceptance criteria

### CAP-SUP-005-AC-01

- **Given** a price list from an approved supplier with two known article numbers
- **When** the purchaser imports and confirms it
- **Then** two proposed purchase prices are saved
- **Covers:** main flow step 4

### CAP-SUP-005-AC-02

- **Given** a price list with one unknown article number
- **When** the purchaser imports it
- **Then** that line is skipped
- **And** the purchaser sees it in the list of skipped lines
- **Covers:** alternative flow

## Out of scope

- Price lists in another currency (DEC-002).

## Open questions

None.
