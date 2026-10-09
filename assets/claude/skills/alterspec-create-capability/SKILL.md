---
name: alterspec-create-capability
description: "Use when the person wants a new thing a user can do, one goal in one session (capability, CAP-…): \"buyers should be able to reorder\", \"add approve price\". Interviews, then drafts all thirteen sections; a feature spanning several objects goes to alterspec-change instead."
argument-hint: "<MOD> <title>"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/create-capability.md` exists, read it. Otherwise read `.alterspec/prompts/create-capability.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
