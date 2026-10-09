---
name: alterspec-create-entity
description: "Use when the person wants a new business thing the product keeps (entity, ENT-…): \"we need a Supplier\", \"add Invoice\". Attributes in business kinds, relationships, lifecycle states."
argument-hint: "<NAME> <title>"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/create-entity.md` exists, read it. Otherwise read `.alterspec/prompts/create-entity.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
