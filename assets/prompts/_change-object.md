# Changing one existing object (shared by the alterspec-change-* commands)

Read `.alterspec/prompts/_shared.md` first and follow it. The type-specific prompt that sent you here lists what to
check for its object type.

## 1. Understand the object and the change

1. If no ID was given, list the objects of that type (`spec/` files or `npx @alterset/alterspec show <MOD>`) and ask
   which one.
2. Run `npx @alterset/alterspec show <ID>`. Summarise the object in a few lines: what it is, its status and version,
   what it references and what references it.
3. Ask what should change and why, at most 3 questions at a time. If the request is really several product changes,
   or adds or removes other objects, suggest `/alterspec-change` for the whole set instead.
4. Agree the list of edits before touching any file. Include knock-on edits: objects that reference this one and must
   follow (from "Referenced by" in `show`).

## 2. Decide where to edit

Check whether `spec/_generated/baseline.json` exists.

**No baseline yet:** edit the files in `spec/` directly.

**Baseline exists:** every edit goes through a change proposal.
1. List the open changes (`spec/changes/CHG-*/proposal.md` with status `draft` or `in_review`) and ask whether this edit
   belongs to one of them, or start one: `npx @alterset/alterspec change new --title "<why>" --json`.
2. If the chosen change is `approved`, tell the person that editing it needs a new review, and only continue if they
   agree: `npx @alterset/alterspec change status <CHG> in_review`.
3. Copy the object into the change: `npx @alterset/alterspec change edit <CHG> <ID> --json`. Do the same for every
   knock-on object. Edit only the copies under `spec/changes/<CHG>/spec/`.
4. New objects needed by the edit: `npx @alterset/alterspec new <type> ... --change <CHG> --json`.

## 3. Make the edits

- Front-matter first, then the body sections it affects. Keep them consistent.
- Keep IDs: never renumber or reuse. An object that should disappear is removed through `/alterspec-change`
  (`change remove`), not by deleting its file.
- Don't touch `version`: `apply` raises it for changes. Before a baseline, leave `version` alone too.
- Status: if the edit reopens questions on an object that is `refined` or later, set it back to `draft` and say so.
  Never raise a status here; that is `/alterspec-refine`'s job, or the person's explicit word.
- Unknowns become open questions, as the shared rules say.

## 4. Check and hand over

- **No baseline:** run `npx @alterset/alterspec views`, then `npx @alterset/alterspec show <ID>` for every object you
  touched, and fix every error.
- **Baseline:** run `npx @alterset/alterspec validate --change <CHG>` and fix every error inside the change. Add a line
  for this edit to the proposal's "What changes" section (and "Why", if the change is new). Then run
  `npx @alterset/alterspec impact <CHG>` and summarise the affected flows, objects and acceptance criteria.

Finish with what changed, and the next step: `/alterspec-refine <ID>` if gaps were reopened; with a baseline,
`/alterspec-impact <CHG>` and `/alterspec-apply <CHG>` when the change is complete.
