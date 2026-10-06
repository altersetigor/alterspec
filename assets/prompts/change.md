# /alter-change — propose a change to the product spec

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<title>` of a new change, or `<CHG>` to continue an open one.

A change proposal holds everything a product change adds, modifies or removes, until the person approves it and
`/alter-apply` merges it. The main `spec/` stays untouched until then.

## 1. Start or continue

- New: `npx @alterset/alterspec change new --title "<title>" --json`.
- Existing: read `spec/changes/<CHG>/proposal.md`. If its status is `approved`, tell the person that editing it needs
  a new review: `npx @alterset/alterspec change status <CHG> in_review`.

## 2. Understand the change

Interview the person (at most 3 questions at a time):
1. why the product changes: the business reason, who asked, what goes wrong today
2. what changes, in their words
3. which existing objects are involved: look them up and confirm IDs with `npx @alterset/alterspec show <ID>`

Summarise the list of objects to add, modify and remove, and agree on it.

## 3. Make the edits inside the change

For each object:
- modify: `npx @alterset/alterspec change edit <CHG> <ID> --json`, then edit the reported copy under
  `spec/changes/<CHG>/spec/`. Use the interview style of the matching authoring command (`capability.md`,
  `screen.md`, `entity.md`) for the details.
- add: `npx @alterset/alterspec new <type> ... --change <CHG> --json`, then fill it.
- remove: `npx @alterset/alterspec change remove <CHG> <ID>`, then edit (in the change) every object that referenced it.

Never edit files under `spec/` outside `spec/changes/<CHG>/`. Never edit `base` or `approved_hash` in the proposal.
For a capability whose behaviour changes, raise nothing yourself: `apply` raises `version`.

## 4. Describe and check

1. Write the proposal's "Why" and "What changes" sections in business language.
2. Run `npx @alterset/alterspec validate --change <CHG>` and fix every error inside the change.
3. Run `npx @alterset/alterspec impact <CHG> --write`. Read it: affected flows, acceptance criteria and objects. Ask
   the person whether the affected objects need changes too; if yes, add them to the change.
4. Ask the `alter-reviewer` agent to review the change (scope `<CHG>`). Fix critical and major findings with the
   person, or record them as open questions in the proposal.

## 5. Hand over for review

When there are no errors and no conflicts: `npx @alterset/alterspec change status <CHG> in_review`.
Tell the person the change is ready for review, summarise the impact in a few lines, and explain that
`/alter-apply <CHG>` will ask for their explicit approval before merging.
