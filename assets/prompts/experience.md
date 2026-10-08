# /alterspec-experience — the experience layer

Read `.alterspec/prompts/_shared.md` first and follow it.

The experience layer (`spec/experience/`) shows the product as it will be: mockups that look and behave like the
finished application, and a contract per screen precise enough that a developer never has to ask the product owner or
a designer anything. It is part of the spec and UI-technical by design: it may name components, regions, layout and
interaction details. It never changes what the product does.

- `design-system.md` — tokens, typography, components (the yaml `components:` block), responsive and accessibility
  rules. `patterns.md` — archetypes and their regions (the yaml `archetypes:` block), state and microcopy patterns.
- `screens/UX-SCR-….md` — one experience screen per business screen: archetype, every business element with its
  region, component and exact label, the states (one link each: `?as=<role>&state=<id>`), and how it behaves.
- `mockups/` — the application:
  - `index.html` — the sign-in page: one card per demo person; signing in as a role is the only demo feature.
  - `SCR-….html` — one page per screen, bound to the demo data: lists open records, forms save, actions change data.
  - `config.js` — the app's name, logo, currency, locale, icons, image URL template and demo people (yours to edit).
  - `data.js` — the demo data (yours to edit; `experience seed` writes a first version).
  - `spec.js` — written by the CLI from the spec; never edit it. `kit/` — the runtime and styles.

**Zero deviation.** Business screen, experience screen and mockup must agree completely: every field, action and
business state of the screen appears with its `data-src`, nothing else is added, labels match, every role and state
is shown. If the design needs something the business spec lacks (a field, an action, a filter, a message, a rule), stop
and say so: it goes into the business spec first (`/alterspec-change-screen`, `/alterspec-change-entity`…), then
`alterspec experience sync`. Never add it only to the mockup.

**It must look like the real app.** Nothing on a page may be something a real user wouldn't see: no notes about the
mockup, no spec IDs, no state switches, no explanations of what a button would do. States are reached through links
in the experience screen and the handoff, never through controls on the page. The `experience-chrome` check flags
violations.

Once a baseline exists, every command below needs `--change <CHG>`: ask which open change to use, or start one with
`/alterspec-change`.

## `init` — the app and its design

1. Run `npx @alterset/alterspec experience init --json`. It adds the design system, patterns, the kit, `config.js`,
   `spec.js`, seeded `data.js` and the sign-in page, and never overwrites. On an existing layer, `--kit` refreshes the
   kit, `spec.js` and the sign-in page to this version.
2. Interview, at most 3 questions at a time:
   - The product as people will see it: its name, logo (URL or a file to put in `mockups/assets/`), currency and
     locale. Write them into `config.js`.
   - Brand: does the team have a design system or component library? If yes: its tokens and components — put the
     tokens into `mockups/kit/tokens.css`, restyle `mockups/kit/components.css` (or add their stylesheet and link it),
     list their components in `design-system.md`. If not: primary colour, font, corner radius, light or dark.
   - Screenshots or a live application to match: propose tokens and patterns from them and let the person confirm.
     Never present a guess as their brand.
   - The demo people: one or more per role, with realistic names and the persona they stand for. Edit `users` in
     `config.js`.
3. Make the demo data realistic (see **Realistic data** below).
4. Run `npx @alterset/alterspec validate` and fix `experience-vocabulary` findings.

## Realistic data

`experience seed` writes neutral placeholder data. Replace it in `mockups/data.js` with content that reads like the
real product, based on the application's vision, glossary and entities:

- Real-looking names, titles, prices, dates, descriptions and statuses for every record; enough records to fill lists
  (about 8 per entity), spread over the lifecycle states.
- References point to existing record ids; `owner` points to a demo person, so `own`-scoped screens show each person
  their own records.
- Photos: use image URLs that match each record (for example a specific photo of a white baby cot for a "Baby cot"
  listing). Search for freely licensed images when you can browse; otherwise keep the `images` template from
  `config.js`, which gives real photos with random subjects. Note the source in `design-system.md`.
- Never invent business facts the spec doesn't support: data illustrates the spec, it doesn't extend it.
- Change `version` in `data.js` after editing, so browsers load the new data.

## `<SCR>` — design one screen

1. Run `npx @alterset/alterspec show <SCR>`. If the business screen still has gaps (missing purpose, states, fields),
   close them first with `/alterspec-refine <SCR>`: an experience screen can't be ready on top of gaps.
2. If there is no experience screen yet, run `npx @alterset/alterspec experience new <SCR> --json`. It drafts the
   experience screen and a working page; both already pass every check.
3. Interview about what the draft can't know: which archetype; what goes where; component per field and action;
   exact labels and messages; what happens after each action (confirmation, where the person lands, focus);
   validation messages per required field and per rule; loading and error behaviour; narrow screens; keyboard.
4. Hand the answers to the `alterspec-ux-designer` agent with the screen ID. It updates the experience screen and the
   page and reports anything the business spec must provide.
5. Run `npx @alterset/alterspec validate` and resolve every `experience-*` finding.
6. Ask the person to open `spec/experience/mockups/index.html`, sign in as each role and try the screen. Give them the
   state links from the experience screen (for example `SCR-…html?as=ROLE-…&state=empty`). Iterate.

## `review <SCR>` — prove parity

1. Run the `alterspec-experience-reviewer` agent on the screen.
2. If it reports any row other than MATCH, any developer question or anything a real user wouldn't see, fix it
   (business spec first where needed) and review again.
3. Only when the review is clean: `npx @alterset/alterspec experience reviewed <SCR>`. It refuses while any check
   fails. Moving the experience screen to `ready` or `approved` needs the person's explicit word.

## `sync <SCR>` — after the business screen changed

1. Run `npx @alterset/alterspec experience sync <SCR> --json`. It removes elements the screen no longer has, adds new
   ones as drafts in an "Added by sync" block of the page, adds missing states and records the new alignment.
2. Place the added elements properly (designer agent), then `validate`, then `review <SCR>`.

## `rebuild <SCR>` — a fresh page from the contract

`npx @alterset/alterspec experience rebuild <SCR>` renders the page again from the experience screen on the current
kit: labels, regions, components and states are kept; hand edits to the page are replaced. Use it after upgrading the
kit, or when a page has drifted too far to repair. Tell the person first if the page has hand edits.
