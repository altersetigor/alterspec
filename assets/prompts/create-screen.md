# /alterspec-create-screen — create a screen spec

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<MOD> <title>`. Use `GLB` for screens everyone shares (dashboard, notifications, profile). Ask for
whatever is missing.

A screen spec describes what people see and do, in business terms: never layout, widgets or styling.

1. Read the module and its capabilities so you can link actions to them.
2. Interview:
   - purpose of the screen, and how people get there (other screens or situations)
   - which channels it is for, only when the application has more than one channel people use (not `api`); otherwise
     leave `channels` empty, which means every channel
   - the business information shown: for each entity, which of its attributes, and whether the screen shows many
     records (`list`), one record (`view`) or one record being entered or changed (`edit`). Use the entity's attribute
     names exactly. Information no entity holds is a gap: ask whether an entity needs a new attribute.
   - whether some data or actions are only for some of the screen's roles
   - the actions available, and which capability each action performs
   - what differs per role (what each sees and can do)
   - the business states: nothing to show yet, no permission, validation errors (what the person is told)
   - whether a mockup exists: Figma link, image, HTML or other, and where
3. Summarise, then run `alterspec new screen --module <MOD> --title "<title>" --json`.
4. Fill the front-matter: `roles`, `channels` (names from `application.md`, or empty), `fields` (`entity`,
   `attributes`, `mode`, optional `roles`), `entry_points`,
   `actions` (`A01`, `A02`… each with `label`, `capability` and optional `roles`) and `mockups` (`type` and `ref`).
   Fill every body section.
   - Data shown in `edit` mode needs an action whose capability creates or updates that entity; data shown in `list`
     or `view` mode needs a capability on the screen that uses the entity.
   - Every action must be performable by at least one of the screen's roles.
5. Each capability an action performs must list this screen in its `screens`; add it there too.
6. If an action needs a capability that doesn't exist yet, list it as a next step for `/alterspec-create-capability`.
7. Run `alterspec views` and `alterspec show <SCR>`; fix errors.
8. If the project has an experience layer (`spec/experience/`), suggest `/alterspec-experience <SCR>` once the screen
   is refined.
