# /alterspec-init — start the product spec

Read `.alterspec/prompts/_shared.md` first and follow it.

Goal: from a short interview, write the application skeleton in `spec/application/` and the module list.

1. If `spec/` doesn't exist, run `npx @alterset/alterspec init` first.
2. Read `spec/application/application.md`, `personas-roles.md` and `glossary.md`. If they already hold real content,
   say so and ask whether to extend them rather than start over.
3. Interview, in this order, a few questions at a time:
   1. the product in one or two sentences, and the main problems it solves, for whom
   2. the product profile, which decides how much there is to specify (see the shared rules):
      - the apps and channels people use: for each, a name, its kind (backoffice, customer, partner, mobile, web,
        api, other) and who uses it; for web kinds, whether it must work on phones and tablets (`responsive`); for
        mobile, whether it works without a connection (`offline`)
      - one company or many (`tenancy`): with several, whether tenants see shared data or only their own
      - the languages people use the product in, and with several, which one is the default; and whether content
        people enter is translated too, or only the interface
      - the currencies amounts are in, and with several, which one is the default
      - one time zone or one per person, and which time zone the product lives in
      Offer the simple answer first (one company, one language, one currency, one time zone); most products are.
   3. the people involved: personas (who they are, their goals, their pain points) and roles (what access they need).
      Keep persona and role apart: one persona can hold several roles, one role can serve several personas.
   4. the main business areas, which become modules, each with a 2–6 letter code. Shared screens (dashboard,
      notifications, profile) go in a module with code `GLB`.
   5. the key business terms, and words the team should not use for them
4. Summarise and confirm. Then write:
   - channels: `alterspec new channel --name "<Name>" --kind <kind> --audience "<who>" [--responsive|--no-responsive]
     [--offline] --json`, one per channel
   - the profile: one `alterspec profile set --tenancy <single|multi> [--tenant-data <shared|separate>]
     --languages <a,b> [--default-language <a>] [--localised-content] --currencies <a,b> [--default-currency <a>]
     --time-zones <single|per_user> [--time-zone "<zone>"] --json`. With several languages or currencies it refuses
     without a default: ask, don't pick.
   - the prose of `application.md`: vision, problems solved, apps and channels (what each channel is for, in words),
     high-level business architecture
   - roles first: `alterspec new role --name <NAME> --title "<Title>" --json`, then fill the role's description
   - personas: `alterspec new persona --name <NAME> --title "<Title>" --role <ROLE> --json`, then goals and pain points;
     add more roles to its `roles` list when it has several
   - modules: `alterspec new module --code <CODE> --title "<Title>" --json`, then a one-paragraph description of what
     the module covers and does not cover
   - glossary: `alterspec new term --term "<Term>" --forbidden "<a>,<b>" --json`, then a one or two sentence definition
5. Run `alterspec views` and `alterspec validate`; fix any errors.
6. Suggest next steps: `/alterspec-create-entity` for the main business things, then `/alterspec-create-capability` per module.
