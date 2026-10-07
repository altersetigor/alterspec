---
name: alterspec-prototype
description: "Set up the design for alterspec prototypes and build or check a design-system variant (Bootstrap, Tabler, Tailwind or your own)."
argument-hint: "[bootstrap|tabler|tailwind|custom|check|design]"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep Bash(npx @alterset/alterspec *)
---

If `.alterspec/custom/prompts/prototype.md` exists, read it. Otherwise read `.alterspec/prompts/prototype.md`.
Follow those instructions exactly.

Arguments: $ARGUMENTS
