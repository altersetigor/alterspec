---
name: alterspec
description: "Use for anything the person says about the product or its spec in their own words that doesn't name an alterspec skill: a question (\"what can a sales rep do with a price?\", \"what is still open?\", \"is pricing ready?\") or a wish (\"I want…\", \"add…\", \"change…\", \"rename…\", \"we need…\"). Answers from the spec; routes a wish to grooming (the one skill that writes the spec) and design talk to the experience skill."
argument-hint: "[what you want, in your words]"
allowed-tools: Read Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/alterspec.md` exists, read it. Otherwise read `.alterspec/prompts/alterspec.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
