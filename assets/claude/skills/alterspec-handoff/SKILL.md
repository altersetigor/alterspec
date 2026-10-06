---
name: alterspec-handoff
description: "Export an alterspec capability or module for Spec Kit, OpenSpec, BMAD or a technical design."
argument-hint: "<CAP|MOD> [target]"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/handoff.md` exists, read it. Otherwise read `.alterspec/prompts/handoff.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
