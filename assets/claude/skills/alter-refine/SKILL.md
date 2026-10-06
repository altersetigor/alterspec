---
name: alter-refine
description: "Interview the user about one alterspec object until no open gaps remain, then update its status."
argument-hint: "<ID>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/refine.md` exists, read it. Otherwise read `.alterspec/prompts/refine.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
