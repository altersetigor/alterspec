# /alter-capability — create a capability

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<MOD> <title>`. Ask for whatever is missing.

## 1. Scope it

1. Read the module (`alterspec show MOD-<CODE>`), `spec/application/personas-roles.md`, `glossary.md`, and the
   entities and screens the capability is likely to touch, so you reuse existing IDs.
2. Ask: who does it (persona and acting role), what goal they reach, and what ends it.
3. Apply the granularity rule. If it covers two goals, two acting roles, or pauses for someone else, propose the split
   (titles and roles) and agree on which part to write now.

## 2. Interview

Work through the sections in this order, at most 3 questions at a time. Offer existing IDs as choices.

1. user story (persona-based) and business value
2. roles and their permission scope: own, team, org or all
3. preconditions and what triggers it
4. main flow, step by step: for each step, the screen and the action used
5. alternative and exception flows
6. data in and data out (entity attributes); entity operations (C create, R read, U update, D delete, A archive) and
   state changes
7. business rules that apply: existing `RULE-*`, or new ones
8. notifications, and business events emitted or consumed
9. acceptance criteria: Given / When / Then, each linked to a rule or a main-flow step
10. what is out of scope

As referenced objects come up that don't exist yet, ask, then create them with `new` (`rule`, `event`, `screen`,
`entity`), so the capability only references existing IDs. Unknowns become open questions.

## 3. Write

1. Summarise the capability in a few lines and let the person correct it.
2. Run `alterspec new capability --module <CODE> --title "<title>" --role <ROLE> --scope <scope> --json`.
3. Fill the front-matter yourself: `roles`, `screens`, `entities` (with `ops` and `transitions`), `rules`, `events`,
   `depends_on`, `flows`. Every transition must exist in the entity's lifecycle.
4. Delegate the body to the `alter-analyst` agent in **draft mode**. Give it the capability ID and file, and all the
   answers you collected, grouped by section, in the person's words. It writes the body and returns open questions.
5. Read the result. Check it against the answers; fix anything that was added without being said.
6. If a screen action performs this capability, add the screen to `screens`; if a flow should include it, add a step
   to the flow and the flow to `flows`. Ask before changing flows.
7. Run `alterspec views` and `alterspec show <CAP>`; fix errors.
8. Show the person the result briefly and suggest `/alter-refine <CAP>` to close the remaining gaps.
