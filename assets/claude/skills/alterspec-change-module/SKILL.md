---
name: alterspec-change-module
description: "Change an existing alterspec module: its description, dependencies or module rules. Uses a change proposal once the spec is baselined."
argument-hint: "<MOD>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/change-module.md` exists, read it. Otherwise read `.alterspec/prompts/change-module.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
