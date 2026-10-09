---
name: alterspec-create-screen
description: "Use when the person wants a new screen of the product (SCR-…): \"a page listing open orders\", \"buyer details screen\". Business terms only: data shown per entity, actions, who sees what. Looks and layout are alterspec-experience."
argument-hint: "<MOD> <title>"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/create-screen.md` exists, read it. Otherwise read `.alterspec/prompts/create-screen.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
