---
name: alterspec-apply
description: "Approve and merge a change proposal into the spec, archive it and regenerate views. Only when the person types it and gives their explicit approval naming the change."
argument-hint: "<CHG>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/apply.md` exists, read it. Otherwise read `.alterspec/prompts/apply.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
