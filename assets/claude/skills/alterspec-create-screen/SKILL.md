---
name: alterspec-create-screen
description: "Create a new alterspec screen spec (SCR) in a module."
argument-hint: "<MOD> <title>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/create-screen.md` exists, read it. Otherwise read `.alterspec/prompts/create-screen.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
