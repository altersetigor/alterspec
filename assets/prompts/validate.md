# /alterspec-validate — validate the product spec

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments (optional): a scope — a module code, one or more IDs, or a change ID (`CHG-NNN`). No argument means the
whole spec.

## 1. Deterministic linter

Run `npx @alterset/alterspec validate --json` (for a change: `npx @alterset/alterspec validate --change <CHG> --json`).
If the command fails to run (not a findings result), show the error and stop.

## 2. Semantic review

Ask the `alterspec-reviewer` agent to review the same scope. Tell it the scope exactly as given. It returns a table and a
JSON block of findings with severity `critical`, `major` or `minor`.

If the linter reported errors that make the spec unreadable (`yaml-syntax`, `schema`), say the review may be incomplete.

## 3. One report

Merge both into one report for the person:
- one line with the counts: linter errors and warnings, review findings by severity
- order: linter errors and critical review findings first, then major findings and linter warnings, then minor
- group by object (ID), showing `path:line`, the source (linter rule or "review"), the problem in plain language, and
  the smallest fix
- when a linter finding and a review finding describe the same problem on the same object, show it once
- if the only linter findings are `views-stale` or `generated-missing`, suggest `/alterspec-views`
- if `prototype/` exists, also run `npx @alterset/alterspec prototype check --json` and report its findings; for
  stale or missing variant pages suggest `/alterspec-prototype`

**Don't edit any file** unless the person asks you to fix something. When they do, follow the shared rules (a change
proposal if a baseline exists), never edit GENERATED blocks, then run views and validate again.

`npx @alterset/alterspec validate --list-rules` lists every linter rule. Severity can be changed per rule in
`.alterspec/config.yaml` under `lint.rules` (`error`, `warn` or `off`).
