---
name: alterspec-change
description: "Use when the person wants to continue an open change proposal (CHG-…) or lists several known edits to make one by one inside one proposal: \"continue CHG-003\", \"in this change also rename the status and add the margin field\". For an idea to work out first, alterspec-groom. Opens or continues the proposal and makes every edit inside it, interviewing as it goes."
argument-hint: "<title> | <CHG>"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/change.md` exists, read it. Otherwise read `.alterspec/prompts/change.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
