---
name: alterspec-init
description: "Start a product spec from nothing: installs the framework if needed and grooms the application skeleton (product and profile, personas and roles, modules, glossary) from the person's description of the product, asked once. Only when the person asks to start or initialise the spec."
argument-hint: "[app name]"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/init.md` exists, read it. Otherwise read `.alterspec/prompts/init.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
