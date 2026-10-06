---
name: alter-validate
description: "Validate the alterspec product spec: deterministic linter plus semantic review, merged into one findings report."
allowed-tools: Read Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/validate.md` exists, read it. Otherwise read `.alterspec/prompts/validate.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
