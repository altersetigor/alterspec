---
id: ENT-{{entity}}
title: "{{title}}"
status: draft
attributes: []
# - name: Full name
#   kind: text              # text | number | amount | date | period | yes_no | choice | reference | document | other
#   required: true
#   description: As shown on official documents
# - name: Department
#   kind: reference
#   references: ENT-DEPARTMENT   # reference attributes: the entity referred to
# - name: Contract type
#   kind: choice
#   options: [Permanent, Fixed term]   # choice attributes: the values a person can pick
relationships: []
# - entity: ENT-DEPARTMENT
#   cardinality: one        # one | many
#   description: The department the employee belongs to
states: []
# - draft
# - active
# initial_state: draft
transitions: []
# - from: draft
#   to: active
---

# {{title}}

<!-- Business attributes only (no storage or technical types). Lifecycle states are business states. -->

## Description

<!-- What this thing is in the business, and who cares about it. -->

## Attributes

<!-- Explain attributes that need more than the front-matter description. -->

## Lifecycle

<!-- Explain each state and what moves the entity between states. Every transition must be performed
     by at least one capability (listed in that capability's `entities[].transitions`). -->

## Coverage

<!-- GENERATED:start entity-coverage -->
<!-- GENERATED:end -->
