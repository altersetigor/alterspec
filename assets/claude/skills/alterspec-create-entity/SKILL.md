---
name: alterspec-create-entity
description: "Create a new alterspec business entity (ENT) with attributes and lifecycle states."
argument-hint: "<NAME> <title>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/create-entity.md` exists, read it. Otherwise read `.alterspec/prompts/create-entity.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
