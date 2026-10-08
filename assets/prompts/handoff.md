# /alterspec-handoff — hand a capability or module over to development

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<CAP|MOD> [target]`. Targets:
- `bundle` — one self-contained document (README.md + bundle.json) for a technical design or any other tool, with a
  clickable prototype of the screens in scope (`prototype/index.html`, made-up data)
- `speckit` — a GitHub Spec Kit feature spec (`spec.md`)
- `openspec` — an OpenSpec change folder (`proposal.md`, `tasks.md`, `specs/<capability>/spec.md`)
- `bmad` — a BMAD epic breakdown (`epics.md`)
- `all` — every target

alterspec stays a product spec: it never makes technology decisions. Handoff is where they start, in the target tool.

## 1. Check

1. If the target is missing, ask which one (offer the list above).
2. Run `npx @alterset/alterspec show <ID>` for a capability, or `npx @alterset/alterspec validate` for a module.
   Handoff refuses objects with lint errors, and capabilities below `ready`.
   - If capabilities are still `draft` or `refined`, suggest `/alterspec-refine` first. Only use `--allow-draft` when the
     person explicitly wants a draft export.
   - Open questions in scope are exported as clarification points; mention them.
   - With an experience layer (`spec/experience/`), handoff also refuses until every screen in scope has an
     experience screen that is `ready` or later, has no findings, and passed its parity review since its last edit.
     `--allow-draft` doesn't lift this. Point the person to `/alterspec-experience <SCR>` and
     `/alterspec-experience review <SCR>`.

## 2. Export

Run `npx @alterset/alterspec handoff <ID> --target <target> --json`. It writes only to `handoff/<target>/<ID>/`
and replaces what was there. Each folder has a `manifest.json` with the source IDs, versions and fingerprints.

## 3. Optional polish

If the person asks, improve the wording of the exported files so they read naturally in the target's style. You may
rephrase sentences. You may **not** add or remove requirements, scenarios, acceptance criteria, business facts, IDs or
any technology, and you must keep the alterspec ID markers (`<!-- alterspec: ... -->`, `*(CAP-…)*`). Say what you
changed. Re-running the export overwrites the polish, so suggest polishing as the last step.

## 4. Explain the next step

- **speckit:** copy `handoff/speckit/<ID>/spec.md` to `specs/<next number>-<short-name>/spec.md` in the repository
  that uses Spec Kit (the "Feature Branch" line suggests a name), then run Spec Kit's clarify or plan command there.
- **openspec:** copy the folder inside `handoff/openspec/<ID>/` to `openspec/changes/` and run `openspec validate`.
- **bmad:** give `handoff/bmad/<ID>/epics.md` to BMAD as the epics document (its planning artifacts folder). BMAD's
  formats are changing between versions; check the stories after import.
- **bundle:** use `handoff/bundle/<ID>/README.md` as the input for the technical design; `prototype/` shows the
  screens.

Remind the person that the alterspec spec stays the source of truth: product changes go through `/alterspec-change`, then
a new handoff. The manifest shows which version was handed over.
