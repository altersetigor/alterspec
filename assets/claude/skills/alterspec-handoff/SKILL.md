---
name: alterspec-handoff
description: "Export an alterspec capability or module as a self-contained bundle for the development team."
argument-hint: "<CAP|MOD>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/handoff.md` exists, read it. Otherwise read `.alterspec/prompts/handoff.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
