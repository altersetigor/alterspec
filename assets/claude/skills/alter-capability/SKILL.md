---
name: alter-capability
description: "Create a new alterspec capability (CAP) in a module, asking questions to fill its front-matter and business body."
argument-hint: "<MOD> <title>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/capability.md` exists, read it. Otherwise read `.alterspec/prompts/capability.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
