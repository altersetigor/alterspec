---
name: alterspec-change-screen
description: "Change an existing alterspec screen (SCR): the data it shows, its actions or per-role differences. Uses a change proposal once the spec is baselined."
argument-hint: "<SCR>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/change-screen.md` exists, read it. Otherwise read `.alterspec/prompts/change-screen.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
