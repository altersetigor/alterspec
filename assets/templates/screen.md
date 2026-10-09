---
id: SCR-{{MOD}}-{{NN}}
title: "{{title}}"
module: MOD-{{MOD}}
status: draft
roles: []
# - role: ROLE-...
#   scope: own              # own | team | org | all (optional: narrows what this role sees here)
channels: []                # channel names from application.md; empty: every channel
fields: []
# - entity: ENT-...
#   attributes: [Name, Status]   # attribute names exactly as the entity lists them
#   mode: list                   # list (many records) | view (one record) | edit (one record being entered)
#   roles: []                    # optional: only these screen roles see this data
entry_points: []
# - SCR-GLB-NN              # screens or situations that lead here
actions: []
# - id: A01
#   label: Approve request
#   capability: CAP-{{MOD}}-NNN
#   roles: []               # optional: only these screen roles see the action
mockups: []
# - type: figma             # figma | image | html | other
#   ref: <link or path>
---

# {{title}}

<!-- Business view of a screen: what people see and do. No layout code, widgets or technical detail. -->

## Purpose

## Entry points

## Displayed data

<!-- What `fields` doesn't say: why this data, in which order it matters, what is highlighted. -->

## Actions

<!-- One line per action in the front-matter: A01 — label → CAP-... -->

## Per-role differences

<!-- What each role sees or can do differently. -->

## Business states

- **Empty:** <!-- nothing to show yet -->
- **No permission:** <!-- the person may not see this -->
- **Validation errors:** <!-- what the person is told and why -->

## Used by capabilities

<!-- GENERATED:start screen-capabilities -->
<!-- GENERATED:end -->
