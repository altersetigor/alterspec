---
name: alterspec-change-capability
description: "Use when the person wants to change something a user can already do (capability, CAP-…): behaviour, roles and scopes, rules, data, acceptance criteria: \"sales reps may also approve\", \"reorder must skip discontinued articles\". One capability; after the baseline the edit goes into a change proposal."
argument-hint: "<CAP>"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/change-capability.md` exists, read it. Otherwise read `.alterspec/prompts/change-capability.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
