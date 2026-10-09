---
name: alterspec-groom
description: "Use when the person presents an idea or a feature to work out, in a sentence or a pasted brief: \"buyers should see their order history and reorder\", \"we want to reserve stock for customers\". Drafts the whole proposal first (module, entities, capabilities, screens, rules, what was not proposed, open questions), asks once, and on their go executes it as a change proposal up to review."
argument-hint: "[the idea, in your words]"
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/groom.md` exists, read it. Otherwise read `.alterspec/prompts/groom.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
