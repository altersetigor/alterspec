---
name: alterspec-change
description: "Use when the person describes a product change or feature that touches several objects, or wants to continue an open change proposal (CHG-…): \"buyers should see their order history and reorder\", \"continue CHG-003\". Opens or continues the proposal and makes every edit inside it."
argument-hint: "<title> | <CHG>"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/change.md` exists, read it. Otherwise read `.alterspec/prompts/change.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
