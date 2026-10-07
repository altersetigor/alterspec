# /alterspec-change-screen — change an existing screen

Read `.alterspec/prompts/_change-object.md` and follow it. Arguments: `<SCR>`.

What to check, depending on what changes:

- **Actions** — each action (`A01`, `A02`…) performs one capability. Adding an action: the capability must list this
  screen in `screens` (edit it too). Removing an action: check that capability's main flow no longer uses it. Keep
  existing action IDs; new ones take the next number.
- **Fields** — `fields` lists the data shown, per entity: attribute names exactly as the entity lists them, and the
  mode (`list`, `view`, `edit`). Information that no entity holds is a gap: ask whether an entity needs a new attribute
  (`/alterspec-change-entity`). Data in `edit` mode needs an action whose capability creates or updates the entity.
  Keep the "Displayed data" section consistent with `fields`.
- **Roles and per-role differences** — the front-matter `roles`, the optional `roles` on fields and actions, and the
  "Per-role differences" section must agree, and must not show data a role's scope in the related capabilities doesn't
  allow. Every action must be performable by at least one screen role.
- **Business states** — empty, no permission, validation errors: update them when actions or data change.
- **Mockups** — update `mockups` (`type`, `ref`) when the person has a new design; describe the screen in business
  terms only, never layout or widgets.

The "Used by capabilities" block is generated: never edit it.
