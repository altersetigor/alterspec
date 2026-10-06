---
name: alterspec-create-module
description: "Create a new alterspec module (MOD) and register it in the application."
argument-hint: "<CODE> <title>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/create-module.md` exists, read it. Otherwise read `.alterspec/prompts/create-module.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
