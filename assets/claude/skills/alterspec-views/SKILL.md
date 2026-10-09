---
name: alterspec-views
description: "Regenerate the generated views (module capability lists, role matrices, traceability, coverage, wireframe data) after spec edits, or when validate reports stale views. Never edits hand-written content."
allowed-tools: Read Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/views.md` exists, read it. Otherwise read `.alterspec/prompts/views.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
