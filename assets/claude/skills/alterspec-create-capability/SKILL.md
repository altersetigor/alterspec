---
name: alterspec-create-capability
description: "Create a new alterspec capability (CAP) in a module, interviewing the user to fill its front-matter and business body."
argument-hint: "<MOD> <title>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/create-capability.md` exists, read it. Otherwise read `.alterspec/prompts/create-capability.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
