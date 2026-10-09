---
name: alterspec-change-screen
description: "Use when the person wants to change what an existing screen shows or does (SCR-…): data, actions, filters, states, per-role differences: \"show the margin on the approval screen\", \"add a cancel action\". Business content only; after the baseline the edit goes into a change proposal."
argument-hint: "<SCR>"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/change-screen.md` exists, read it. Otherwise read `.alterspec/prompts/change-screen.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
