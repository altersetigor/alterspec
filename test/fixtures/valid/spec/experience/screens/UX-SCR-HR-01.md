---
id: UX-SCR-HR-01
screen: SCR-HR-01
status: ready
archetype: editor
reviewed: 7cbd00d85c39
dry: 1982ba86d066
elements:
  - src: SCR-HR-01
    region: header
    component: page-title
    label: Employee record
  - src: SCR-HR-01.ENT-EMPLOYEE
    region: form
    component: section
    label: Employee
  - src: SCR-HR-01.ENT-EMPLOYEE.Full name
    region: form
    component: field-text
    label: Full name
  - src: SCR-HR-01.ENT-EMPLOYEE.Start date
    region: form
    component: field-date
    label: Start date
  - src: SCR-HR-01.ENT-EMPLOYEE.Contract type
    region: form
    component: field-select
    label: Contract type
  - src: SCR-HR-01.A01
    region: actions
    component: button-primary
    label: Register
  - src: SCR-HR-01.A02
    region: actions
    component: button-secondary
    label: Activate
  - src: SCR-HR-01.A03
    region: actions
    component: button-secondary
    label: Record leaving
  - src: SCR-HR-01.state.empty
    region: messages
    component: empty-state
    label: a new employee with nothing filled in.
  - src: SCR-HR-01.state.no-permission
    region: messages
    component: permission-state
    label: other roles are told the record is for HR only.
  - src: SCR-HR-01.state.validation
    region: messages
    component: validation-summary
    label: a missing full name or start date is named.
states:
  - id: default
    as: ROLE-HR-MANAGER
  - id: empty
    as: ROLE-HR-MANAGER
  - id: no-permission
  - id: validation
    as: ROLE-HR-MANAGER
---

# Employee record: experience

<!--
The experience contract of SCR-HR-01: how the screen looks and behaves, precisely enough that a developer never has
to ask. It may name components, layout and interaction details. It must not add or drop business content: every
field, action and state comes from SCR-HR-01, and a new one goes into the business spec first.
-->

## Layout

<!-- Regions of the archetype from top to bottom and left to right, and what sits in each. -->

Header with the title and the actions on the right; the form below in one column.

## Interactions

<!-- What happens on each action: dialogs, confirmations, navigation, what is selected or focused afterwards. -->

Register saves the record and shows a confirmation; Activate and Record leaving ask for confirmation first.

## Validation messages

<!-- One line per required field and per business rule the screen enforces: when it shows and the exact text. -->

- Full name: "Enter the full name."
- Start date: "Enter the start date."

## Loading and errors

<!-- What people see while data loads, when it fails, and how they retry. -->

Skeleton fields while loading; an error card with Retry when saving fails.

## Responsive behaviour

<!-- What changes on narrow screens: what collapses, moves or hides. -->

Below 1024px the actions move under the title.

## Accessibility

<!-- Keyboard order, focus after actions, labels for icon-only controls, announcements. -->

Focus starts on Full name; after saving, focus moves to the confirmation.

## Open questions

<!-- Anything still unclear. A screen with open questions can't be ready. -->

None.
