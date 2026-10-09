# Modules (reference for grooming)

What a proposal must say about a module, how it is written, and what to check when one changes. Read by
`/alterspec-groom`; never a skill of its own.

A module is a business area with rules of its own. The proposal places a feature in an existing module unless it is
a new business area with its own rules and roles, and says why either way under "Where it lives".

## What a proposal says about a new module

1. a 2–6 letter code (`GLB` is reserved for shared screens) and a title
2. what the module covers and what it deliberately does not cover
3. which other modules it depends on (`depends_on`: only modules whose capabilities, entities or rules it really uses)
4. its own rules, each in one testable sentence ("A … must … when …"); a rule two modules share is an application
   rule in `application/rules.md` instead
5. the capabilities it needs, as capabilities of the same proposal (see `_capability.md`)

## Writing a new module

1. `alterspec new module --code <CODE> --title "<title>" --json` (with `--change <CHG>` after the baseline). It
   creates the folder and adds the module to `application.md`.
2. Write the Description section and set `depends_on`.
3. Rules: `alterspec new rule --module <CODE> --title "<rule>" --json` per rule, then the sentence.
4. `alterspec views` and `alterspec show MOD-<CODE>` (or `validate --change <CHG>`); fix every error.

## Changing an existing module

- **Description** — what it covers and what it doesn't. If scope moves to or from another module, its capabilities
  move too: a set of new and removed capabilities in the same proposal.
- **`depends_on`** — only real dependencies.
- **Module rules** (`modules/<code>/rules.md`, `RULE-<CODE>-NNN`) — each rule is its own object: `change edit <CHG>
  RULE-<CODE>-NNN` (or edit directly before a baseline); add one with `alterspec new rule --module <CODE> --title
  "…"` (`--change <CHG>` after a baseline). `alterspec show <RULE>` says which capabilities apply the rule; their
  acceptance criteria must still match the new wording. A rule now used by other modules belongs in
  `application/rules.md`: a new application rule plus a removal, in the same proposal.
- **Title** — only if the business name changed; keep the code and ID.

The capability list and role matrix in `module.md` are generated: never edit them; `views` (or `apply`) updates them.
