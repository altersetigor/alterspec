---
name: alter-apply
description: "Merge an approved alterspec change proposal into the spec, archive it and regenerate views."
argument-hint: "<CHG>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/apply.md` exists, read it. Otherwise read `.alterspec/prompts/apply.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
