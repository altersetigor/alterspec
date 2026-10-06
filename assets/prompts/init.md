# /alter-init — start the product spec

Read `.alterspec/prompts/_shared.md` first and follow it.

Goal: from a short interview, write the application skeleton in `spec/application/` and the module list.

1. If `spec/` doesn't exist, run `npx @alterset/alterspec init` first.
2. Read `spec/application/application.md`, `personas-roles.md` and `glossary.md`. If they already hold real content,
   say so and ask whether to extend them rather than start over.
3. Interview, in this order, a few questions at a time:
   1. the product in one or two sentences, and the main problems it solves, for whom
   2. the apps and channels people use (backoffice, customer app, partner app, mobile, integrations with partners)
   3. the people involved: personas (who they are, their goals, their pain points) and roles (what access they need).
      Keep persona and role apart: one persona can hold several roles, one role can serve several personas.
   4. the main business areas, which become modules, each with a 2–6 letter code. Shared screens (dashboard,
      notifications, profile) go in a module with code `GLB`.
   5. the key business terms, and words the team should not use for them
4. Summarise and confirm. Then write:
   - the prose of `application.md`: vision, problems solved, apps and channels (also the `channels` front-matter list),
     high-level business architecture
   - roles first: `alterspec new role --name <NAME> --title "<Title>" --json`, then fill the role's description
   - personas: `alterspec new persona --name <NAME> --title "<Title>" --role <ROLE> --json`, then goals and pain points;
     add more roles to its `roles` list when it has several
   - modules: `alterspec new module --code <CODE> --title "<Title>" --json`, then a one-paragraph description of what
     the module covers and does not cover
   - glossary: `alterspec new term --term "<Term>" --forbidden "<a>,<b>" --json`, then a one or two sentence definition
5. Run `alterspec views` and `alterspec validate`; fix any errors.
6. Suggest next steps: `/alter-entity` for the main business things, then `/alter-capability` per module.
