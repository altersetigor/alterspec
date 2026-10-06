---
name: alter-handoff
description: "Export a self-contained alterspec bundle for a capability or module, for Spec Kit, OpenSpec, BMAD or a tech design."
argument-hint: "<CAP|MOD> [target]"
disable-model-invocation: true
allowed-tools: Read Write Glob Grep
---

If `.alterspec/custom/prompts/handoff.md` exists, read it. Otherwise read `.alterspec/prompts/handoff.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
