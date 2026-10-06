---
name: alter-module
description: "Create a new alterspec module (MOD) from the template and register it in the application."
argument-hint: "<CODE> <title>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/module.md` exists, read it. Otherwise read `.alterspec/prompts/module.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
