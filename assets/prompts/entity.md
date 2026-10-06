# /alter-entity — create a business entity

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<NAME> <title>` (NAME in upper case, words joined with `-`). Ask for whatever is missing.

1. Check the glossary: the entity title should be a canonical term. Offer to add it if it's missing.
2. Ask about:
   - business attributes: name, kind (text, number, amount, date, period, yes_no, choice, reference, document,
     other), whether required, and a short description. Never storage or technical types.
   - relationships to other entities (one / many)
   - lifecycle: the business states, the initial state, and the allowed transitions between states
   - who creates, views, changes and archives it (this guides later capabilities)
3. Create `spec/application/entities/ENT-<NAME>.md` from the `entity.md` template. Every transition must use
   states listed in `states`.
4. Remind the user that every transition must be performed by at least one capability, and list the transitions
   that no capability covers yet.
