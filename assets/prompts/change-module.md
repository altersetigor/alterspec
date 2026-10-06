# /alterspec-change-module — change an existing module

Read `.alterspec/prompts/_change-object.md` and follow it. Arguments: `<MOD>` (`MOD-CAT` or just `CAT`).

What a module change can touch, and what to check:

- **Description** — what the module covers and what it deliberately doesn't. If scope moves to or from another
  module, its capabilities may need to move too: that is a set of new and removed capabilities, so suggest
  `/alterspec-change`.
- **`depends_on`** — only modules whose capabilities, entities or rules this module really uses.
- **Module rules** (`modules/<code>/rules.md`, `RULE-<CODE>-NNN`) — each rule is its own object. Change one with
  `change edit <CHG> RULE-<CODE>-NNN` (or directly before a baseline); add one with
  `npx @alterset/alterspec new rule --module <CODE> --title "..."` (plus `--change <CHG>` after a baseline). Check with
  `npx @alterset/alterspec show <RULE>` which capabilities apply the rule, and whether their acceptance criteria still
  match the new wording. A rule now used by other modules belongs in `application/rules.md` instead: that is a new
  application rule plus a removal, so use `/alterspec-change`.
- **Title** — only if the business name changed; keep the code and ID.

The capability list and role matrix in `module.md` are generated: never edit them; `views` (or `apply`) updates them.
