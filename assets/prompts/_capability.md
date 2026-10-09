# Capabilities (reference for grooming)

What a proposal must say about a capability, how it is written, and what to check when one changes. Read by
`/alterspec-groom`; never a skill of its own.

## What a proposal says about a capability

One capability = one user goal, reached in one session, by the roles allowed to perform it (one or several, each with
its own scope). Two goals, or work that pauses for someone else (an approval, a reply from a partner), are two
capabilities joined by a flow step or an event. Several roles doing the same thing is one capability.

For a new capability, the proposal gives, each marked `(proposed)` where it is neither in the idea nor in the spec:

1. the user story (persona-based) and the business value
2. the roles and their permission scope: own, team, org or all; in a multi-tenant product (profile), also what the
   role sees across tenants, which goes under "Permissions and data visibility"
3. preconditions and what triggers it
4. the main flow, step by step: for each step, the screen and the action used
5. alternative and exception flows: what happens when a rule is broken, data is missing, or the person lacks permission
6. data in and data out (entity attributes); entity operations (C create, R read, U update, D delete, A archive)
   and state changes. Only when the profile has several currencies: which currency each amount is in and whether it is
   converted; only with `time_zones: per_user`: in whose time zone dates are shown
7. the business rules that apply: existing `RULE-*`, or new ones (module rule if only this module uses it)
8. notifications, and business events emitted or consumed
9. acceptance criteria: Given / When / Then, each linked to a rule or a main-flow step
10. what is out of scope

Referenced objects that don't exist yet (a rule, an event, a screen, an entity) are proposed in their own sections, so
the capability references only IDs that will exist. Unknowns are open questions, never guesses.

## Writing a new capability

1. `alterspec new capability --module <CODE> --title "<title>" --role <ROLE> --scope <scope> --json` (with
   `--change <CHG>` after the baseline).
2. Fill the front-matter from the document: `roles`, `screens`, `entities` (with `ops` and `transitions`), `rules`,
   `events`, `depends_on`, `flows`. Every transition must exist in the entity's lifecycle.
3. Delegate the body to the `alterspec-analyst` agent in **draft mode**: the capability ID, the file (the copy inside
   the change when there is a baseline), and the document's sections as the answers. It writes the body and returns
   open questions.
4. Read the result against the document; remove anything that was added without being said.
5. If a screen action performs this capability, the screen lists it in `actions` and the capability lists the screen in
   `screens`. If a flow includes it, the flow has the step and the capability lists the flow in `flows`.
6. `alterspec views` and `alterspec show <CAP>` (or `validate --change <CHG>`); fix every error.

## Changing an existing capability

Read the capability, its screens, entities and rules, and the flows it belongs to, before proposing. Depending on
what changes:

- **Goal or roles** — check the granularity rule again. If the change makes it two capabilities, propose the split.
- **Roles and scopes** — the "Permissions and data visibility" section must match the front-matter `roles`.
- **Main flow and screens** — every step names a screen and an action; each screen action that performs this
  capability must exist on that screen (`change edit` the screen too), and the screen must be listed in `screens`.
- **Entities** — operations (C R U D A) and `transitions` must match "Data in / data out" and "State transitions
  caused". A transition must exist in the entity's lifecycle; if it doesn't, the entity changes too (same change).
- **Rules** — every rule in `rules` is applied in the body and covered by an acceptance criterion.
- **Events** — every emitted or consumed event is explained under "Notifications". A newly consumed event needs an
  emitter or `external: true`.
- **Flows** — if the capability's place in a flow changes, edit the flow too; `flows` and the flow's steps must agree.
- **Acceptance criteria** — update the ones affected; add new ones with the next number (`<CAP>-AC-NN`). If one no
  longer applies, remove it and renumber the ones after it so they stay sequential (the linter requires 01, 02, …);
  say so in the change.
- **Status** — if the edit reopens questions on an object that is `refined` or later, set it back to `draft` and say
  so. Never raise a status here.

Delegate a larger rewrite of the body to the `alterspec-analyst` agent in **draft mode**, as for a new capability.

## Finishing a capability (gap analysis)

The analyst's gap analysis checks at least: the user story names a persona and the goal and benefit are clear; every
main-flow step names a screen and an action the screen has; exceptions exist for a broken rule, missing data and
missing permission; every rule in front-matter is applied in the body and covered by a criterion; every entity
operation and state change in front-matter appears in the flow and vice versa; every event is explained under
Notifications; permissions match each role's scope; criteria are testable (concrete Given / When / Then with a
"Covers" link); nothing contradicts a referenced rule, lifecycle or another capability.
