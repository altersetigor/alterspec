---
name: alterspec-change-entity
description: "Change an existing alterspec business entity (ENT): attributes, relationships or lifecycle. Uses a change proposal once the spec is baselined."
argument-hint: "<ENT>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/change-entity.md` exists, read it. Otherwise read `.alterspec/prompts/change-entity.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
