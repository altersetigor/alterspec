# /alter-module — create a module

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<CODE> <title>`. Ask for whatever is missing.

1. Check that `MOD-<CODE>` doesn't exist yet in `spec/modules/` (folder name is the code in lower case).
2. Ask what the module covers, and what it deliberately does not cover.
3. Create `spec/modules/<code>/module.md` from the `module.md` template, and empty folders
   `capabilities/` and `screens/`. Create `spec/modules/<code>/rules.md` from `module-rules.md` only when the
   module has its own rules; remove the template's example item.
4. Add `MOD-<CODE>` to `modules` in `spec/application/application.md` front-matter and to its Modules section.
5. Ask for the first capabilities the module needs (titles only) and list them as next steps for
   `/alter-capability`. Don't create them unless the user asks.
