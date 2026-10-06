---
name: alter-init
description: "Start an alterspec product spec: interview the user and create the application skeleton (application, personas and roles, glossary, module list)."
argument-hint: "[app name]"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep
---

If `.alterspec/custom/prompts/init.md` exists, read it. Otherwise read `.alterspec/prompts/init.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
