---
name: alterspec-change-capability
description: "Change an existing alterspec capability (CAP): its behaviour, roles, rules, data or acceptance criteria. Uses a change proposal once the spec is baselined."
argument-hint: "<CAP>"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/change-capability.md` exists, read it. Otherwise read `.alterspec/prompts/change-capability.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
