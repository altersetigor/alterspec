# /alterspec-impact — impact analysis of a change

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<CHG>`.

1. Run `npx @alterset/alterspec impact <CHG> --json`. If it fails because the change doesn't exist, list the open
   changes (`spec/changes/CHG-*/proposal.md`) and stop.
2. Ask the `alterspec-reviewer` agent to review the change (scope `<CHG>`).
3. Write a summary for a business reader:
   - what the change does, in two or three sentences (from the proposal and the added / modified / removed objects)
   - conflicts with the current spec, if any, and what to do (re-read the object, then
     `npx @alterset/alterspec change edit <CHG> <ID> --rebase` and redo the edit)
   - who and what is affected: flows, screens, roles, acceptance criteria that must be re-checked
   - generated views that will change (module capability lists, role matrices)
   - new lint findings, and findings the change resolves
   - the reviewer's critical and major findings
   - a recommendation: ready for approval, or what must be fixed first
4. If the person asks, save the CLI report with `npx @alterset/alterspec impact <CHG> --write`. Don't edit the change.
