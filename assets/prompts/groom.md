# /alterspec-groom — the one way to write the spec: draft, confirm once, execute

Read `.alterspec/prompts/_shared.md` first and follow it.

Every business change goes through here, whatever its size: a whole product from an idea, a new business area, a
feature, a new screen, one attribute, an object to finish, a change proposal to continue, a mockup that shows
something the spec lacks. The pattern is always the same: read the ground without asking, draft the whole proposal,
mark every fact that is neither in the idea nor in the spec as `(proposed)` and list it to confirm, ask once, and
write nothing into the spec before the person says go.

Arguments: the idea in the person's words (a sentence, a paragraph, a pasted brief); an object ID to finish ("finish
CAP-PRC-003", "what is missing in the buyer entity"); a `CHG-…` to continue; or nothing, then ask for it in one line.

## 1. Take the idea

Keep it verbatim for the document. Don't interview: what the idea doesn't say is proposed or asked in step 4.

## 2. Find the ground, without asking

Read `spec/_generated/index.json`, `spec/application/application.md` (the product profile), `glossary.md`,
`personas-roles.md`, the modules, the entities and flows the idea touches, and `npx @alterset/alterspec show <ID>
--json` for every object it names or implies. Note what already exists and what the profile settles.

The ground has a **shape**, and the shape sizes the proposal:

- **Empty spec** (`application.md` lists no modules): the proposal is the application skeleton. Read
  `.alterspec/prompts/_skeleton.md`.
- **One object to finish** (an ID, or "finish", "complete", "what is missing"): ask the `alterspec-analyst` agent
  for a **gap analysis** of the object and merge it with `show`'s findings and the open questions recorded against
  it. The proposal is that list, most important first, each gap with a proposed answer or an open question.
- **One object to change, or one new object** ("add gender to buyer", "we need a Supplier"): a proposal of a few
  lines; the sections that don't apply say "None.". Knock-on edits ("Referenced by" in `show`) are part of it.
- **A feature or a business area**: the full proposal.
- **A change to continue** (`CHG-…`): read its `proposal.md` and `groom.md`. If the document is `proposed`, go to
  step 4 with what is still open; if `confirmed`, go to step 5; if `executed`, report where it stands and what is
  left (`impact`, review, apply). An `approved` change goes back to `in_review` first, and only with the person's
  agreement, because it needs a new review.
- **A document written by `experience lift`** (its idea starts with "The mockup of"): the idea and the ground are
  already in it; continue at step 3.3.

The per-type references say what a proposal must cover: `_module.md`, `_entity.md`, `_capability.md`,
`_screen.md`.

## 3. Draft the proposal

1. Check whether `spec/_generated/baseline.json` exists. With a baseline, the change will hold the edits; without
   one, the edits go straight into `spec/` later, but the grooming document is written all the same.
2. Run `npx @alterset/alterspec change new --title "<short title from the idea>" --groom --json`. It creates
   `spec/changes/<CHG>/` with `proposal.md` and `groom.md` (from the template).
3. Delegate `groom.md` to the `alterspec-analyst` agent in **proposal mode**: give it the change ID, the file, the idea
   verbatim, the shape of the ground and the IDs you found. It fills every section of the document and touches
   nothing else.
4. Read the result. Check that every `(proposed)` fact is repeated under "To confirm", that no technology slipped
   in, that the capabilities follow the granularity rule, and that the proposal is no larger than the idea needs.
   Fix the document, not the spec.

## 4. Ask once, then wait

In one message, in the person's language, not in IDs, sized to the proposal (three lines for one attribute, a page
for a feature):

- where it lives, and whether anything new is proposed at module or entity level
- the capabilities (one line each: who reaches what goal), the screens, the rules
- "Not proposed, and why", so they can override
- the "To confirm" list and the "Open questions", numbered, to answer in one go

Then stop and wait. Treat the reply like this:

- corrections, alternatives to weigh, questions about the proposal → update `groom.md`, show the differences in
  two lines, ask whether to go; as many rounds as the person wants, never the same question twice
- answers → write them into the document; questions left unanswered stay open questions, never guesses
- "go", "yes", "do it" or any explicit agreement → set `status: confirmed`, then step 5
- "no" or "drop it" → `npx @alterset/alterspec change status <CHG> rejected`; the document stays as the record

Never start step 5 without that agreement.

## 5. Execute from the document

All edits through the CLI, inside the change (`--change <CHG>` on `new`, `change edit` for existing objects, `change
remove` for removals); without a baseline the same commands without `--change`, straight into `spec/`. Never edit
`base` or `approved_hash` in the proposal; `apply` raises `version`. In this order, so every reference exists when
it is used; the per-type reference gives the details of each step:

1. The skeleton, when the ground was empty (`_skeleton.md`).
2. Entities and their changes (`_entity.md`); glossary terms; roles if the document proposes one (a new role is a
   product decision: it must be under "To confirm" and confirmed).
3. Rules (`rule --module` for module rules, none for shared rules), events; modules (`_module.md`).
4. Screens (`_screen.md`): `new screen`, then `fields` and `actions` from the document.
5. Capabilities (`_capability.md`): `new capability`, front-matter from the document, then the body by the
   `alterspec-analyst` agent in **draft mode** with the document's sections as the answers.
6. Flow steps that tie the feature into an existing journey, or a new flow.
7. Open questions as `alterspec new decision --title "<question>" --kind open_question`, each with `affects`, and a
   line under each affected object's "Open questions". When the person answered an open question recorded earlier,
   set that `DEC-*` item to `kind: decision`, `status: decided` with today's date, write the answer under it, and
   remove the line from the object's "Open questions" section.
8. `npx @alterset/alterspec change sync <CHG> --json` so the experience follows; note what it drafted.
9. `npx @alterset/alterspec validate --change <CHG>` (or `views` and `show <ID>` without a baseline); fix every error
   inside the change.
10. **Finished object:** when the ground was one object to finish and now `show` reports no errors and no
    `incomplete-section` findings, no open question is recorded against it, and the person agreed it is complete,
    set `status: refined` and raise `version` by 1. Never go beyond `refined` unless the person explicitly asked for
    `ready` or `approved`. If something still blocks, leave the status and list what remains. An edit that reopens
    questions on a `refined` or later object sets it back to `draft`; say so.
11. Write the proposal's "Why" and "What changes" from the document. Set the document's `status: executed`.
12. With a baseline: `npx @alterset/alterspec impact <CHG> --write`, then the `alterspec-reviewer` agent on the
    change. Fix critical and major findings or record them as open questions. Then
    `npx @alterset/alterspec change status <CHG> in_review`.

## 6. Report

In the person's words: what was added and changed (titles, IDs in brackets), the flows affected, what the reviewer
found, what a designer must still place and review (`/alterspec-experience <SCR>`, `review <SCR>`), the open
questions, and the next word that is theirs: `/alterspec-apply <CHG>` when they agree, or `npx @alterset/alterspec
baseline` once the first version is agreed. Never apply, never baseline, never hand off.
