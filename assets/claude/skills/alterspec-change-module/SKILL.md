---
name: alterspec-change-module
description: "Use when the person wants to change an existing business area (module, MOD-…): its description, dependencies or module rules: \"the pricing module also depends on catalog\", \"add a rule to ordering\". One module; after the baseline the edit goes into a change proposal."
argument-hint: "<MOD>"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/change-module.md` exists, read it. Otherwise read `.alterspec/prompts/change-module.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
