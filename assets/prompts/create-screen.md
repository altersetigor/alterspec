# /alterspec-create-screen — create a screen spec

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<MOD> <title>`. Use `GLB` for screens everyone shares (dashboard, notifications, profile). Ask for
whatever is missing.

A screen spec describes what people see and do, in business terms: never layout, widgets or styling.

1. Read the module and its capabilities so you can link actions to them.
2. Interview:
   - purpose of the screen, and how people get there (other screens or situations)
   - the business information shown, using entity attribute names from the glossary
   - the actions available, and which capability each action performs
   - what differs per role (what each sees and can do)
   - the business states: nothing to show yet, no permission, validation errors (what the person is told)
   - whether a mockup exists: Figma link, image, HTML or other, and where
3. Summarise, then run `alterspec new screen --module <MOD> --title "<title>" --json`.
4. Fill the front-matter: `roles`, `entry_points`, `actions` (`A01`, `A02`… each with `label` and `capability`) and
   `mockups` (`type` and `ref`). Fill every body section.
5. Each capability an action performs must list this screen in its `screens`; add it there too.
6. If an action needs a capability that doesn't exist yet, list it as a next step for `/alterspec-create-capability`.
7. Run `alterspec views` and `alterspec show <SCR>`; fix errors.
