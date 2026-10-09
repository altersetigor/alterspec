---
name: alterspec-refine
description: "Use when the person wants to finish, complete or close the gaps of one spec object (CAP, SCR, ENT, MOD): \"what is missing in propose price?\", \"finish the buyer entity\". Interviews only about the gaps; moves the object to refined when nothing is open."
argument-hint: "<ID>"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/refine.md` exists, read it. Otherwise read `.alterspec/prompts/refine.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
