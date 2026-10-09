---
name: alterspec-impact
description: "Use when the person asks what a change proposal affects or whether it is ready for review (CHG-…): flows, screens, roles, acceptance criteria, generated views, new and resolved findings. Read-only."
argument-hint: "<CHG>"
allowed-tools: Read Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/impact.md` exists, read it. Otherwise read `.alterspec/prompts/impact.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
