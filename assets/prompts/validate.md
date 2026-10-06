# /alter-validate — validate the product spec

Read `.alterspec/prompts/_shared.md` first and follow it.

1. Run `npx @alterset/alterspec validate --json` from the project root.
2. If the command fails to run (not a findings result), show the error and stop.
3. Report the result to the user:
   - one line with the counts: errors and warnings
   - errors first, then warnings, grouped by file, as `path:line — rule — message`
   - for each group, a short explanation in plain language of what is wrong and the smallest fix
   - if many findings share one cause (for example a renamed ID), say so once instead of repeating it
4. If the only findings are `views-stale` or `generated-missing`, suggest `/alter-views` (or
   `npx @alterset/alterspec views`).
5. **Don't edit any file** unless the user asks you to fix something. When they do, change the front-matter or prose,
   never the GENERATED blocks, then run `npx @alterset/alterspec views` and validate again.

`npx @alterset/alterspec validate --list-rules` lists every rule. Rule severity can be changed in
`.alterspec/config.yaml` under `lint.rules` (`error`, `warn` or `off`).

Note: this version runs the deterministic linter only. The semantic review (contradictions, ambiguous acceptance
criteria, permission holes) arrives in a later version of alterspec.
