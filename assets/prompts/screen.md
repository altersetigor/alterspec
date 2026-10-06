# /alter-screen — create a screen spec

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<MOD> <title>`. Use `GLB` for shared screens (dashboard, notifications, profile). Ask for whatever is
missing.

1. Pick the next `SCR-<CODE>-NN` in that module.
2. Ask about: purpose, how people get there (entry points), the business information shown, the actions
   available and which capability each action performs, per-role differences, and the empty / no-permission /
   validation-error states. Ask whether a mockup exists (Figma link, image, HTML or other) and record it under
   `mockups`.
3. Create `spec/modules/<code>/screens/SCR-<CODE>-NN.md` from the `screen.md` template. Number actions `A01`, `A02`…
4. Describe what people see and do, never layout code or widgets.
5. If an action points to a capability that doesn't exist yet, list it as a next step for `/alter-capability`.
