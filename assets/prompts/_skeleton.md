# The application skeleton (reference for grooming on an empty spec)

What a proposal must say when the spec is empty, and how the skeleton is written. Read by `/alterspec-groom` when
`application.md` lists no modules; never a skill of its own. The person's description of the product is the idea;
everything below that the description does not say is `(proposed)` and listed to confirm, with the simple answer
offered first.

## What the proposal says

1. **The product**: in one or two sentences, the main problems it solves, and for whom.
2. **The product profile**, which decides how much there is to specify:
   - the apps and channels people use: for each, a name, its kind (backoffice, customer, partner, mobile, web, api,
     other) and who uses it; for web kinds, whether it must work on phones and tablets (`responsive`); for mobile,
     whether it works without a connection (`offline`)
   - one company or many (`tenancy`): with several, whether tenants see shared data or only their own
   - the languages people use the product in, and with several, which one is the default; whether content people
     enter is translated too, or only the interface
   - the currencies amounts are in, and with several, which one is the default
   - one time zone or one per person, and which time zone the product lives in
   Propose the simple answer (one company, one language, one currency, one time zone) unless the idea says
   otherwise; most products are. With several languages or currencies, a default is mandatory: an open question if
   the idea doesn't say.
3. **The people**: personas (who they are, their goals, their pain points) and roles (what access they need). Persona
   and role stay apart: one persona can hold several roles, one role can serve several personas.
4. **The business areas**, which become modules, each with a 2–6 letter code and what it covers. Shared screens
   (dashboard, notifications, profile) go in a module with code `GLB`.
5. **The key business terms**, with the words the team should not use for them.

Nothing below the skeleton (entities, capabilities, screens) is proposed here unless the idea describes them; they
come with the next grooming.

## Writing the skeleton

In this order, all through the CLI:

1. Channels: `alterspec new channel --name "<Name>" --kind <kind> --audience "<who>" [--responsive|--no-responsive]
   [--offline] --json`, one per channel.
2. The profile: one `alterspec profile set --tenancy <single|multi> [--tenant-data <shared|separate>]
   --languages <a,b> [--default-language <a>] [--localised-content] --currencies <a,b> [--default-currency <a>]
   --time-zones <single|per_user> [--time-zone "<zone>"] --json`. With several languages or currencies it refuses
   without a default: never pick one; it must have been confirmed.
3. The prose of `application.md`: vision, problems solved, apps and channels (what each channel is for, in words),
   high-level business architecture.
4. Roles first: `alterspec new role --name <NAME> --title "<Title>" --json`, then the role's description.
5. Personas: `alterspec new persona --name <NAME> --title "<Title>" --role <ROLE> --json`, then goals and pain
   points; add more roles to its `roles` list when it has several.
6. Modules: `alterspec new module --code <CODE> --title "<Title>" --json`, then a one-paragraph description of what
   the module covers and does not cover.
7. Glossary: `alterspec new term --term "<Term>" --forbidden "<a>,<b>" --json`, then a one or two sentence
   definition.
8. `alterspec views` and `alterspec validate`; fix every error.

There is no baseline yet, so everything is written straight into `spec/`; the grooming document stays with its
change folder as the record. Next: the main business things and the capabilities, through grooming again.
