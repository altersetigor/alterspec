---
id: UX-SCR-PRC-01
screen: SCR-PRC-01
status: ready
archetype: list
reviewed: 5d2eea23c368
dry: 3e68ec77afe9
elements:
  - src: SCR-PRC-01
    region: header
    component: page-title
    label: Sales price review
  - src: SCR-PRC-01.ENT-PURCHASE-PRICE
    region: results
    component: data-table
    label: Purchase price
  - src: SCR-PRC-01.ENT-PURCHASE-PRICE.Supplier
    region: results
    component: table-column
    label: Supplier
  - src: SCR-PRC-01.ENT-PURCHASE-PRICE.Amount
    region: results
    component: table-column
    label: Amount
  - src: SCR-PRC-01.ENT-PURCHASE-PRICE.Valid from
    region: results
    component: table-column
    label: Valid from
  - src: SCR-PRC-01.ENT-SALES-PRICE
    region: detail
    component: section
    label: Sales price
  - src: SCR-PRC-01.ENT-SALES-PRICE.Article
    region: detail
    component: field-reference
    label: Article
  - src: SCR-PRC-01.ENT-SALES-PRICE.Amount
    region: detail
    component: field-amount
    label: Amount
  - src: SCR-PRC-01.ENT-SALES-PRICE.Valid from
    region: detail
    component: field-date
    label: Valid from
  - src: SCR-PRC-01.A01
    region: toolbar
    component: button-primary
    label: Propose
  - src: SCR-PRC-01.A02
    region: toolbar
    component: button-secondary
    label: Approve
  - src: SCR-PRC-01.A03
    region: toolbar
    component: button-secondary
    label: Expire
  - src: SCR-PRC-01.state.empty
    region: messages
    component: empty-state
    label: Nothing waiting; the screen says so.
  - src: SCR-PRC-01.state.no-permission
    region: messages
    component: permission-state
    label: Other roles cannot open it.
  - src: SCR-PRC-01.state.validation
    region: messages
    component: validation-summary
    label: Amount not above the purchase price; article no longer active.
states:
  - id: default
    as: ROLE-PRICING-MANAGER
  - id: empty
    as: ROLE-PRICING-MANAGER
  - id: no-permission
  - id: validation
    as: ROLE-PRICING-MANAGER
---

# Sales price review: experience

<!--
The experience contract of SCR-PRC-01: how the screen looks and behaves, precisely enough that a developer never has
to ask. It may name components, layout and interaction details. It must not add or drop business content: every
field, action and state comes from SCR-PRC-01, and a new one goes into the business spec first.
-->

## Layout

<!-- Regions of the archetype from top to bottom and left to right, and what sits in each. -->

- **Header:** breadcrumb "Pricing", the title, and the Propose, Approve and Expire buttons on the right; Propose is the
  primary button.
- **Results (left):** the purchase prices of the selected article in a table: supplier, amount, valid from and a
  status badge.
- **Detail (right, 360px):** the sales price card: article, amount and valid-from date, with a note that the price
  must cover the purchase price.
- **Messages:** the empty, no-permission and validation messages appear under the header, above the content.

## Interactions

<!-- What happens on each action: dialogs, confirmations, navigation, what is selected or focused afterwards. -->

- **Propose** checks the sales price card; if it is valid, the proposal is saved, a "Sales price proposed"
  confirmation appears for a few seconds, and focus returns to the Article field.
- **Approve** asks for confirmation in a dialog ("Approve this sales price?", buttons Approve and Cancel); after
  approving, the status badge of the price shows "valid".
- **Expire** asks for confirmation in a dialog ("Expire the sales prices of this article?", buttons Expire and
  Cancel); afterwards the article's prices show "expired".
- Choosing another article in the sales price card reloads the purchase price table for that article.

## Validation messages

<!-- One line per required field and per business rule the screen enforces: when it shows and the exact text. -->

- Article, when empty: "Choose an article."
- Article, when the article is no longer active: "This article is no longer active."
- Amount, when empty: "Enter an amount."
- Amount, when not above the valid purchase price (RULE-PRC-001): "The sales price must be above the purchase price."
- Valid from, when empty: "Enter the date the price is valid from."

Messages appear under the field in red; the validation summary above the content repeats them as a list.

## Loading and errors

<!-- What people see while data loads, when it fails, and how they retry. -->

- While loading, the table shows three skeleton rows and the card shows skeleton fields.
- If loading fails, an error card replaces the content: "The prices couldn't be loaded." with a Retry button.
- If saving fails, the card stays filled and shows "The proposal couldn't be saved. Try again." above the fields.

## Responsive behaviour

<!-- What changes on narrow screens: what collapses, moves or hides. -->

Below 1024px the sales price card moves under the purchase price table, the buttons wrap under the title, and the
table scrolls horizontally.

## Accessibility

<!-- Keyboard order, focus after actions, labels for icon-only controls, announcements. -->

- Tab order: header buttons, the table, then the card fields in order.
- The confirmation is announced politely; validation messages are linked to their fields.
- Status badges carry their text, not colour alone.

## Open questions

<!-- Anything still unclear. A screen with open questions can't be ready. -->

None.
