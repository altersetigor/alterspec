---
name: alterspec-create-module
description: "Use when the person wants a new business area of the product (module, MOD-…): \"we need a loyalty module\", \"add an area for returns\". Creates the module and its own rules; capabilities and screens come after."
argument-hint: "<CODE> <title>"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/create-module.md` exists, read it. Otherwise read `.alterspec/prompts/create-module.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
