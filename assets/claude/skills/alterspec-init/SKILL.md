---
name: alterspec-init
description: "Start a product spec from nothing: interview the person and create the application skeleton (application, personas and roles, glossary, module list). Only when the person asks to start or initialise the spec."
argument-hint: "[app name]"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/init.md` exists, read it. Otherwise read `.alterspec/prompts/init.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
