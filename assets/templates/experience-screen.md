---
id: UX-{{SCREEN}}
screen: {{SCREEN}}
status: draft
archetype: {{archetype}}
# dry / reviewed / page are written by `alterspec experience`; don't edit them.
elements: []
# - src: SCR-XX-NN.A01           # a business element of the screen (data-src in the wireframe)
#   region: actions              # a region of the archetype (experience/patterns.md)
#   component: button-primary    # a component of the design system (experience/design-system.md)
#   label: "Approve"             # the exact text people see
#   unavailable: disabled        # optional: hidden | disabled, for roles that may not use it
#   reason: "Only the pricing manager can approve"
states: []
# - id: default                  # every state is one link: ?as=<role>&state=<id>; `default-…` ids show the
#   as: ROLE-...                 #   default content as another role; other ids are marked in the mockup (data-show-in)
# - id: default-guest
#   as: ROLE-...
---

# {{title}}: experience

<!--
The experience contract of {{SCREEN}}: how the screen looks and behaves, precisely enough that a developer never has
to ask. It may name components, layout and interaction details. It must not add or drop business content: every
field, action and state comes from {{SCREEN}}, and a new one goes into the business spec first.
-->

## Layout

<!-- Regions of the archetype from top to bottom and left to right, and what sits in each. -->

## Interactions

<!-- What happens on each action: dialogs, confirmations, navigation, what is selected or focused afterwards. -->

## Validation messages

<!-- One line per required field and per business rule the screen enforces: when it shows and the exact text. -->

## Loading and errors

<!-- What people see while data loads, when it fails, and how they retry. -->

## Responsive behaviour

<!-- What changes on narrow screens: what collapses, moves or hides. -->

## Accessibility

<!-- Keyboard order, focus after actions, labels for icon-only controls, announcements. -->

## Open questions

<!-- Anything still unclear. A screen with open questions can't be ready. -->
