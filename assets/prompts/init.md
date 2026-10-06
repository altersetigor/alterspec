# /alter-init — start the product spec

Read `.alterspec/prompts/_shared.md` first and follow it.

Goal: turn a short interview into the application skeleton in `spec/application/`.

1. Read `spec/application/application.md`, `personas-roles.md` and `glossary.md`. If they already hold real
   content (not just the template), say so and ask whether to extend them instead of starting over.
2. Interview the user, in this order, a few questions at a time:
   - the product in one sentence, and the main problems it solves (for whom)
   - the apps and channels people use (backoffice, customer app, partner app, mobile, integrations)
   - the people involved: personas (who they are, goals, pain points) and roles (what access they need)
   - the main business areas, which become modules (2–6 letter code each)
   - the key business terms, and words the team should NOT use for them
3. Write:
   - `application.md`: vision, problems solved, apps and channels, modules (also in front-matter), and a
     business-level architecture paragraph
   - `personas-roles.md`: one `PER-*` item per persona and one `ROLE-*` item per role
   - `glossary.md`: one item per term with its forbidden synonyms
4. For each module, ask whether to create it now. If yes, follow `.alterspec/prompts/module.md` for it.
5. Summarise and suggest next steps: `/alter-entity` for the main business things, then `/alter-capability`.
