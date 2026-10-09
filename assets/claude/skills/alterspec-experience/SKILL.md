---
name: alterspec-experience
description: "Use when the person talks about how a screen looks or behaves, the mockups or the app: layout, components, labels, states, demo data, \"make the list a table\", \"design the approval screen\", \"review the mockup\", \"the mockup shows a field the spec doesn't have\". Design only: it never adds business content the spec lacks; `lift <SCR>` carries such content into the business spec as a proposal to confirm."
argument-hint: "[init | <SCR> | review <SCR> | sync <SCR> | rebuild <SCR> | lift <SCR>]"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/experience.md` exists, read it. Otherwise read `.alterspec/prompts/experience.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
