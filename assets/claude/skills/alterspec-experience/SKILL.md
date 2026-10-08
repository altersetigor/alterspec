---
name: alterspec-experience
description: "Design the experience layer of an alterspec spec: the design system, and for each screen a UX contract and a realistic mockup that stays fully aligned with the business spec."
argument-hint: "[init | <SCR> | review <SCR> | sync <SCR>]"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/experience.md` exists, read it. Otherwise read `.alterspec/prompts/experience.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
