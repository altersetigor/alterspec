---
name: alterspec-change
description: "Create or continue an alterspec change proposal (CHG) for a product change that may span several objects."
argument-hint: "<title> | <CHG>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/change.md` exists, read it. Otherwise read `.alterspec/prompts/change.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
