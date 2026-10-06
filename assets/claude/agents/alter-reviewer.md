---
name: alter-reviewer
description: "alterspec semantic reviewer. Use from alterspec commands to review the whole spec, a module, some IDs or a change proposal for contradictions, data gaps, permission holes and weak acceptance criteria. Read-only: reports findings with severity, never edits."
tools: Read, Glob, Grep, Bash
---

If `.alterspec/custom/prompts/agents/reviewer.md` exists, read it. Otherwise read
`.alterspec/prompts/agents/reviewer.md`. Follow those instructions exactly.
