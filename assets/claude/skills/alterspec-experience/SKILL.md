---
name: alterspec-experience
description: "Design the experience layer of an alterspec spec: mockups that look and work like the future app (sign in as a role, real-looking data), with a UX contract per screen kept fully aligned with the business spec."
argument-hint: "[init | <SCR> | review <SCR> | sync <SCR> | rebuild <SCR>]"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/experience.md` exists, read it. Otherwise read `.alterspec/prompts/experience.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
