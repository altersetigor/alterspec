---
name: alterspec-impact
description: "Analyse the impact of an alterspec change proposal on flows, matrices, screens and acceptance criteria."
argument-hint: "<CHG>"
allowed-tools: Read Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/impact.md` exists, read it. Otherwise read `.alterspec/prompts/impact.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
