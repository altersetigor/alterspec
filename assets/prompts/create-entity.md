# /alterspec-create-entity — create a business entity

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<NAME> <title>` (NAME in upper case, words joined with `-`). Ask for whatever is missing.

1. Check the glossary: the entity's title should be a canonical term. Offer to add it with `alterspec new term`.
2. Interview:
   - what the thing is in the business, and who cares about it
   - its business attributes: name, kind (text, number, amount, date, period, yes_no, choice, reference, document,
     other), whether required, a short description. Never storage or technical types. For a `reference`, which
     entity it points to (`references`); for a `choice`, the values a person can pick (`options`).
   - relationships to other entities (one or many)
   - its lifecycle: business states, the initial state, and which state changes are allowed
   - who creates it, views it, changes it, and archives or deletes it
3. Summarise, then run `alterspec new entity --name <NAME> --title "<title>" --json`.
4. Fill the front-matter (`attributes`, `relationships`, `states`, `initial_state`, `transitions`) and the body
   sections: Description, Attributes (only what needs more than the front-matter), Lifecycle (each state and what moves
   the entity between states).
5. Every transition must be performed by at least one capability, and someone must create, read, update and archive or
   delete the entity. Run `alterspec views` and `alterspec show <ENT>`, and list the uncovered transitions and
   operations as next steps for `/alterspec-create-capability`.
