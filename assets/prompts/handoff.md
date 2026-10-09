# /alterspec-handoff — hand a capability or module over to development

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<CAP|MOD>`.

Handoff writes one self-contained bundle for the development team: `README.md` and `bundle.json` with the capability
(or module) and every role, entity, rule, event, screen, flow and term it needs, a clickable wireframe of the screens
in scope (`wireframe/index.html`, made-up data) and, with an experience layer, their UX contracts and mockups.

alterspec stays a product spec: it never makes technology decisions. Handoff is where they start, with the team.

`/alterspec-apply` already hands off every capability of a change that passes the gate, and refreshes bundles whose
sources changed. This command is for the rest: a whole module as one bundle, an early look at a draft
(`--allow-draft`), or a re-export on demand.

## 1. Check

1. Run `npx @alterset/alterspec show <ID>` for a capability, or `npx @alterset/alterspec validate` for a module.
   Handoff refuses objects with lint errors, and capabilities below `ready`.
   - If capabilities are still `draft` or `refined`, suggest `/alterspec-refine` first. Only use `--allow-draft` when the
     person explicitly wants a draft export.
   - Open questions in scope are exported as clarification points; mention them.
   - With an experience layer (`spec/experience/`), handoff also refuses until every screen in scope has an
     experience screen that is `ready` or later, has no findings, and passed its parity review since its last edit.
     `--allow-draft` doesn't lift this. Point the person to `/alterspec-experience <SCR>` and
     `/alterspec-experience review <SCR>`.

## 2. Export

Run `npx @alterset/alterspec handoff <ID> --json`. It writes only to `handoff/bundle/<ID>/` and replaces what was
there. The folder has a `manifest.json` with the source IDs, versions and fingerprints.

## 3. Optional polish

If the person asks, improve the wording of the exported files so they read naturally. You may
rephrase sentences. You may **not** add or remove requirements, scenarios, acceptance criteria, business facts, IDs or
any technology, and you must keep the alterspec ID markers (`<!-- alterspec: ... -->`, `*(CAP-…)*`). Say what you
changed. Re-running the export overwrites the polish, so suggest polishing as the last step.

## 4. Explain the next step

Use `handoff/bundle/<ID>/README.md` as the input for the technical design; `wireframe/` shows the screens and,
with an experience layer, `experience/mockups/` is the app as designed.

Remind the person that the alterspec spec stays the source of truth: product changes go through `/alterspec-change`, then
a new handoff. The manifest shows which version was handed over.
