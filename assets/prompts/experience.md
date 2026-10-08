# /alterspec-experience — the experience layer

Read `.alterspec/prompts/_shared.md` first and follow it.

The experience layer (`spec/experience/`) says how the product looks and behaves, precisely enough that a developer
never has to ask the product owner or a designer anything. It is part of the spec and UI-technical by design: it may
name components, regions, layout and interaction details. It never changes what the product does.

- `design-system.md` — tokens, typography, components (the yaml `components:` block), responsive and accessibility
  rules. `patterns.md` — archetypes and their regions (the yaml `archetypes:` block), state and microcopy patterns.
- `screens/UX-SCR-….md` — one experience screen per business screen: archetype, every business element with its
  region, component and exact label, the states (one link each: `?as=<role>&state=<id>`), and how it behaves.
- `mockups/` — the kit (`kit/`), `nav.js` (written by the CLI), and one realistic HTML page per screen.

**Zero deviation.** Business screen, experience screen and mockup must agree completely: every field, action and
business state of the screen appears with its `data-src`, nothing else is added, labels match, every role and state
is shown. If the design needs something the business spec lacks (a field, an action, a message, a rule), stop and say
so: it goes into the business spec first (`/alterspec-change-screen`, `/alterspec-change-entity`…), then
`alterspec experience sync`. Never add it only to the mockup.

Once a baseline exists, every command below needs `--change <CHG>`: ask which open change to use, or start one with
`/alterspec-change`.

## `init` — the design system

1. Run `npx @alterset/alterspec experience init --json`. It adds the starter design system, patterns and kit and never
   overwrites.
2. Interview, at most 3 questions at a time:
   - Does the team have its own design system or component library? If yes: its tokens (colours, fonts, radius,
     spacing) and components. Put the tokens into `mockups/kit/tokens.css`, restyle `mockups/kit/components.css` (or
     add their stylesheet and link it from the mockups), and list their components in `design-system.md`.
   - If not: brand colour, font, corner radius, density, light or dark. Adjust `kit/tokens.css`.
   - Screenshots or a live application to match: propose tokens and patterns from them and let the person confirm.
     Never present a guess as their brand.
   - Page archetypes the product needs beyond list, detail, editor, dashboard and dialog; responsive and accessibility
     rules. Update `patterns.md` and `design-system.md`.
3. Run `npx @alterset/alterspec validate` and fix `experience-vocabulary` findings.

## `<SCR>` — design one screen

1. Run `npx @alterset/alterspec show <SCR>`. If the business screen still has gaps (missing purpose, states, fields),
   close them first with `/alterspec-refine <SCR>`: an experience screen can't be ready on top of gaps.
2. If there is no experience screen yet, run `npx @alterset/alterspec experience new <SCR> --json`. It drafts the
   experience screen and the mockup; both already pass every check.
3. Interview about what the draft can't know: which archetype; what goes where; component per field and action;
   exact labels and messages; what happens after each action (dialog, confirmation, navigation, focus); validation
   messages per required field and per rule; loading and error behaviour; narrow screens; keyboard and focus.
4. Hand the answers to the `alterspec-ux-designer` agent with the screen ID. It updates the experience screen and the
   mockup and reports anything the business spec must provide.
5. Run `npx @alterset/alterspec validate` and resolve every `experience-*` finding.
6. Show the person the mockup (`spec/experience/mockups/<SCR>.html`) and the state links in its top bar. Iterate.

## `review <SCR>` — prove parity

1. Run the `alterspec-experience-reviewer` agent on the screen.
2. If it reports any row other than MATCH, or any open question, fix them (business spec first where needed) and
   review again.
3. Only when the review is clean: `npx @alterset/alterspec experience reviewed <SCR>`. It refuses while any check
   fails. Moving the experience screen to `ready` or `approved` needs the person's explicit word.

## `sync <SCR>` — after the business screen changed

1. Run `npx @alterset/alterspec experience sync <SCR> --json`. It removes elements the screen no longer has, adds new
   ones as drafts in an "Added by sync" block of the mockup, adds missing states and records the new alignment.
2. Place the added elements properly (designer agent), then `validate`, then `review <SCR>`.
