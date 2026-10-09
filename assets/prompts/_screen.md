# Screens (reference for grooming)

What a proposal must say about a screen, how it is written, and what to check when one changes. Read by
`/alterspec-groom`; never a skill of its own.

A screen spec describes what people see and do, in business terms: never layout, widgets or styling. Looks belong to
the experience layer (`/alterspec-experience`). Shared screens (dashboard, notifications, profile) live in module
`GLB`.

## What a proposal says about a screen

1. its purpose, and how people get there (other screens or situations): `entry_points`
2. which channels it is for, only when the application has more than one channel people use (not `api`); otherwise
   `channels` stays empty, which means every channel
3. the business information shown: for each entity, which of its attributes, and whether the screen shows many records
   (`list`), one record (`view`) or one record being entered or changed (`edit`). Attribute names exactly as the
   entity lists them. Information no entity holds is a gap: the entity gets the attribute in the same proposal, or
   it is an open question
4. whether some data or actions are only for some of the screen's roles
5. the actions available (`A01`, `A02`…), each with its label and the capability it performs; an action whose
   capability doesn't exist yet is proposed as a capability too
6. what differs per role (what each sees and can do)
7. the business states: nothing to show yet, no permission, validation errors (what the person is told)
8. whether a mockup exists: Figma link, image, HTML or other, and where

## Writing a new screen

1. `alterspec new screen --module <MOD> --title "<title>" --json` (with `--change <CHG>` after the baseline).
2. Fill the front-matter: `roles`, `channels`, `fields` (`entity`, `attributes`, `mode`, optional `roles`),
   `entry_points`, `actions` (each with `label`, `capability` and optional `roles`) and `mockups` (`type`, `ref`).
   Fill every body section; "None." where the document says there is nothing.
   - Data shown in `edit` mode needs an action whose capability creates or updates that entity; data shown in `list`
     or `view` mode needs a capability on the screen that uses the entity.
   - Every action must be performable by at least one of the screen's roles.
3. Each capability an action performs lists this screen in its `screens`; add it there too.
4. `alterspec views` and `alterspec show <SCR>` (or `validate --change <CHG>`); fix every error.
5. With an experience layer (`spec/experience/`), the screen needs an experience: `change sync <CHG>` drafts it
   inside a change; before the baseline, `alterspec experience new <SCR>`.

## Changing an existing screen

- **Actions** — each action performs one capability. Adding an action: the capability must list this screen in
  `screens` (edit it too). Removing an action: check that capability's main flow no longer uses it. Keep existing
  action IDs; new ones take the next number.
- **Fields** — attribute names exactly as the entity lists them, and the mode. Information no entity holds: the entity
  changes in the same proposal. Data in `edit` mode needs an action whose capability creates or updates the entity.
  Keep the "Displayed data" section consistent with `fields`.
- **Roles and per-role differences** — the front-matter `roles`, the optional `roles` on fields and actions, and the
  "Per-role differences" section must agree, and must not show data a role's scope in the related capabilities
  doesn't allow. Every action must be performable by at least one screen role.
- **Business states** — empty, no permission, validation errors: update them when actions or data change.
- **Mockups** — update `mockups` when the person has a new design; business terms only.
- **Status** — an edit that reopens questions on a `refined` or later screen sets it back to `draft`; say so.

The "Used by capabilities" block is generated: never edit it.

**Experience layer.** If `spec/experience/screens/UX-<SCR>.md` exists, the experience screen and its mockup must
follow, or the change can't go to review. Before the baseline, run `alterspec experience sync <SCR>` after the edit;
after the baseline, `alterspec change sync <CHG>` does it for every affected screen. Report what is left to place and
review (`/alterspec-experience <SCR>`, `/alterspec-experience review <SCR>`).

## Finishing a screen (gap analysis)

The analyst checks that `fields` cover what the capabilities on the screen read and capture, that every action has a
role on the screen that can perform it, that the purpose, entry points and the three business states are written, and
that the per-role differences match the capabilities' permissions.
