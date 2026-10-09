---
name: alterspec-groom
description: "Use when the person wants anything about the product added, changed, removed, finished or started: one attribute (\"add gender to buyer\"), a new screen, a feature (\"buyers should see their order history and reorder\"), a new business area, what is missing in an object (\"finish CAP-PRC-003\"), or a change proposal (CHG-…) to continue. The one way the spec is written: drafts the whole proposal at the size of the idea, marks what it proposed, asks once, and on their go executes it, as a change proposal after the baseline."
argument-hint: "[the idea in your words | an ID to finish | a CHG to continue]"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/groom.md` exists, read it. Otherwise read `.alterspec/prompts/groom.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
