---
name: alterspec-change-entity
description: "Use when the person wants to add, rename or remove an attribute, relationship or lifecycle state of an existing business thing (entity, ENT-…): \"add gender to buyer\", \"orders can also be cancelled\". One entity; after the baseline the edit goes into a change proposal."
argument-hint: "<ENT>"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/change-entity.md` exists, read it. Otherwise read `.alterspec/prompts/change-entity.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
