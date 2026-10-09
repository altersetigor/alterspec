---
name: alterspec-validate
description: "Use when the person asks whether the spec is correct, consistent or complete, or wants a review: \"check the spec\", \"any problems in pricing?\". Deterministic linter plus semantic review in one report; never edits."
argument-hint: "[MOD | IDs | CHG]"
allowed-tools: Read Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/validate.md` exists, read it. Otherwise read `.alterspec/prompts/validate.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
