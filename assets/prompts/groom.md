# /alterspec-groom — from an idea to a change ready for review, asked once

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: the idea, in the person's words (a sentence, a paragraph, a pasted brief), or nothing: then ask for it in
one line. Grooming is the draft-then-confirm way of working: the analyst drafts the whole proposal first, the person
corrects and confirms once, and only then is anything written into the spec. Every fact that is not in the idea or in
the spec is marked `(proposed)` and listed for confirmation. Nothing is guessed silently.

## 1. Take the idea

- If the idea is one sentence about one existing object ("add gender to buyer"), say so and hand over to the matching
  single-object skill (`alterspec-change-entity`, `-capability`, `-screen`, `-module`) instead.
- Otherwise keep the idea verbatim for the document.

## 2. Find the ground, without asking

Read `spec/_generated/index.json`, `spec/application/glossary.md`, `personas-roles.md`, the modules, the entities
and flows the idea touches, and `npx @alterset/alterspec show <ID> --json` for every object it names or implies.
Note what already exists and what the product profile in `application.md` settles.

## 3. Draft the proposal

1. Check whether `spec/_generated/baseline.json` exists. With a baseline, the change will hold the edits; without
   one, the edits go straight into `spec/` later, but the grooming document is written all the same.
2. Run `npx @alterset/alterspec change new --title "<short title from the idea>" --groom --json`. It creates
   `spec/changes/<CHG>/` with `proposal.md` and `groom.md` (from the template).
3. Delegate `groom.md` to the `alterspec-analyst` agent in **proposal mode**: give it the change ID, the file, the idea
   verbatim and the IDs you found. It fills every section of the document and touches nothing else.
4. Read the result. Check that every `(proposed)` fact is repeated under "To confirm", that no technology slipped
   in, and that the capabilities follow the granularity rule. Fix the document, not the spec.

## 4. Ask once, then wait

In one message, in the person's language, not in IDs:

- where the feature lives, and whether anything new is proposed at module or entity level
- the capabilities (one line each: who reaches what goal), the screens, the rules
- "Not proposed, and why", so they can override
- the "To confirm" list and the "Open questions", numbered, to answer in one go

Then stop and wait. Treat the reply like this:

- corrections in plain words → update `groom.md` (and `status: confirmed` once they agree), show the differences in
  two lines, ask whether to go
- answers → write them into the document; questions left unanswered stay open questions, never guesses
- "go", "yes", "do it" or any explicit agreement → step 5
- "no" or "drop it" → `npx @alterset/alterspec change status <CHG> rejected`; the document stays as the record

Never start step 5 without that agreement, and never ask the same question twice.

## 5. Execute from the document

All edits through the CLI, inside the change (`--change <CHG>` on `new`, `change edit` for existing objects); without
a baseline the same commands without `--change`. In this order, so every reference exists when it is used:

1. Entities and their changes; glossary terms; roles if the document proposes one (ask first: a new role is a product
   decision, not a detail).
2. Rules (`rule --module` for module rules, none for shared rules), events.
3. Screens: `new screen`, then `fields` and `actions` from the document.
4. Capabilities: `new capability --module --title --role --scope`, front-matter from the document (`roles`,
   `screens`, `entities` with `ops` and `transitions`, `rules`, `events`, `flows`), then the body by the
   `alterspec-analyst` agent in **draft mode** with the document's sections as the answers.
5. Flow steps that tie the feature into an existing journey, or a new flow.
6. Open questions as `alterspec new decision --title "<question>" --kind open_question`, each with `affects`.
7. `npx @alterset/alterspec change sync <CHG> --json` so the experience follows; note what it drafted.
8. `npx @alterset/alterspec validate --change <CHG>`; fix every error inside the change.
9. Write the proposal's "Why" and "What changes" from the document. Set the document's `status: executed`.
10. `npx @alterset/alterspec impact <CHG> --write`, then the `alterspec-reviewer` agent on the change. Fix critical
    and major findings or record them as open questions.
11. `npx @alterset/alterspec change status <CHG> in_review`.

## 6. Report

In the person's words: what was added and changed (titles, IDs in brackets), the flows affected, what the reviewer
found, what a designer must still place and review (`/alterspec-experience <SCR>`, `review <SCR>`), the open
questions, and that `/alterspec-apply <CHG>` is theirs when they agree. Never apply, never hand off.
