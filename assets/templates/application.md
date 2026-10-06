---
id: APP
title: "{{app_name}}"
status: draft
version: 1
channels: []
# - name: Backoffice
#   kind: backoffice        # backoffice | customer | partner | mobile | web | api | other
#   audience: Internal staff
modules: []
# - MOD-HR
---

# {{app_name}}

<!--
alterspec rule: describe WHAT the product does and WHY. No technology:
no databases, endpoints, frameworks, libraries or programming languages.
-->

## Vision

<!-- One paragraph: what the product is and the change it makes for its users. -->

## Problems solved

<!-- Bullet list of the business problems, each from the point of view of a persona (see personas-roles.md). -->

## Apps and channels

<!-- How people and partners reach the product (backoffice, customer app, partner app, mobile, integrations).
     Keep the `channels` list in the front-matter in sync. -->

## Modules

<!-- One line per module: MOD-<CODE> — purpose. Keep the `modules` list in the front-matter in sync. -->

## High-level architecture

<!-- Business-level picture only: which modules talk to which, and which external parties are involved.
     No technical components. -->

## Related documents

- [Personas and roles](personas-roles.md)
- [Glossary](glossary.md)
- [Business rules](rules.md)
- [Events](events.md)
- [Integrations](integrations.md)
- [Non-functional requirements](nfr.md)
- [Decisions](decisions.md)
