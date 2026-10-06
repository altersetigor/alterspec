# /alter-refine — close the gaps in one object

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<ID>` of a capability, screen or entity (other objects: help the person improve the text, but don't change
status).

## Loop

1. Run `alterspec show <ID> --json`. Note: empty or missing sections, findings, open questions, and the objects it
   references and is referenced by.
2. Ask the `alter-analyst` agent for a **gap analysis** of `<ID>`. It returns a numbered list of missing or unclear
   business information, each with a suggested question and the section it belongs to.
3. Merge both into one list of gaps, most important first: errors, then missing business facts, then empty sections,
   then open questions recorded against the object.
4. Interview the person on those gaps only, at most 3 questions at a time. Accept "not decided yet": record it as an
   open question instead.
5. Update the file: front-matter first, then the affected body sections. For larger rewrites of a capability body,
   delegate to `alter-analyst` in draft mode with the new answers.
6. When the person answers an open question, set that `DEC-*` item to `kind: decision`, `status: decided` with
   today's date, write the answer under it, and remove the line from the object's "Open questions" section.
7. Run `alterspec views` and `alterspec show <ID>` again, and repeat from step 3 while gaps remain and the person wants
   to continue.

## Moving to refined

Only when all of these hold:
- `alterspec show <ID>` reports no errors and no `incomplete-section` findings
- no open questions are recorded against the object (open `DEC-*` items affecting it, or lines under "Open questions")
- the person agrees it is complete

Then set `status: refined` and raise `version` by 1. Never go beyond `refined` unless the person explicitly asks for
`ready` or `approved`. If something still blocks, leave the status as it is and list what remains.
