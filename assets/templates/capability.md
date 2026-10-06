---
id: CAP-{{MOD}}-{{NNN}}
title: "{{title}}"
module: MOD-{{MOD}}
status: draft
version: 1
roles:
  - role: ROLE-{{role}}
    scope: own              # own | team | org | all
screens: []
entities: []
# - entity: ENT-...
#   ops: [C, R, U]          # C create, R read, U update, D delete, A archive
#   transitions: []         # e.g. ["draft->active"]
rules: []
events:
  emits: []
  consumes: []
depends_on: []
flows: []
---

# {{title}}

<!-- One user goal, described in business terms. No technology. The front-matter above is authoritative. -->

## Summary and user story

As a <!-- PER-* persona -->, I want <!-- goal -->, so that <!-- benefit -->.

## Business value / problem

## Preconditions and triggers

## Main flow

<!-- Numbered steps. Each step names the screen (SCR-*) and the action (A01…) used. -->

1.

## Alternative and exception flows

## Data in / data out

<!-- Business information, using entity attribute names. -->

## Business rules applied

<!-- By reference: RULE-* — one line on how it applies here. -->

## State transitions caused

<!-- ENT-* from -> to, and why. -->

## Notifications

<!-- Who is told what, and when. EVT-* where relevant. -->

## Permissions and data visibility

<!-- Per role: which data they can see and act on (own / team / org / all). -->

## Acceptance criteria

<!-- Each criterion has an ID and links to a rule or a main-flow step. -->

### CAP-{{MOD}}-{{NNN}}-AC-01

- **Given**
- **When**
- **Then**
- **Covers:** <!-- RULE-* or main flow step N -->

## Out of scope

## Open questions
