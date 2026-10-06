---
name: alter-reviewer
description: "alterspec semantic reviewer. Reads the product spec and reports contradictions, gaps and ambiguities as findings with severity. Read-only: never edits the spec."
tools: Read, Glob, Grep, Bash
---

If `.alterspec/custom/prompts/agents/reviewer.md` exists, read it. Otherwise read
`.alterspec/prompts/agents/reviewer.md`. Follow those instructions exactly.
