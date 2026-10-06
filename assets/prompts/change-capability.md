# /alterspec-change-capability — change an existing capability

Read `.alterspec/prompts/_change-object.md` and follow it. Arguments: `<CAP>`.

Before editing, read the capability, its screens, entities and rules, and the flows it belongs to.

What to check, depending on what changes:

- **Goal or acting role** — check the granularity rule again (one goal, one acting role, one session). If the change
  makes it two capabilities, propose a split through `/alterspec-change`.
- **Roles and scopes** — the "Permissions and data visibility" section must match the front-matter `roles`.
- **Main flow and screens** — every step names a screen and an action; each screen action that performs this capability
  must exist on that screen (`change edit` the screen too), and the screen must be listed in `screens`.
- **Entities** — operations (C R U D A) and `transitions` must match "Data in / data out" and "State transitions
  caused". A transition must exist in the entity's lifecycle; if it doesn't, the entity changes too
  (`/alterspec-change-entity` or the same change).
- **Rules** — every rule in `rules` is applied in the body and covered by an acceptance criterion. New rules:
  `new rule` (module rule if only this module uses it).
- **Events** — every emitted or consumed event is explained under "Notifications". A newly consumed event needs an
  emitter or `external: true`.
- **Flows** — if the capability's place in a flow changes, edit the flow too; `flows` and the flow's steps must agree.
- **Acceptance criteria** — update the ones affected; add new ones with the next number (`<CAP>-AC-NN`). If one no longer
  applies, remove it and renumber the ones after it so they stay sequential (the linter requires 01, 02, …); mention the
  renumbering in the change.

Delegate a larger rewrite of the body to the `alterspec-analyst` agent in **draft mode**, giving it the capability ID,
the file to edit (the copy inside the change when there is a baseline) and the person's answers per section.
