# /alterspec-change-entity — change an existing business entity

Read `.alterspec/prompts/_change-object.md` and follow it. Arguments: `<ENT>`.

Run `npx @alterset/alterspec show <ENT>` first: "Referenced by" lists every capability, rule, event and decision that
depends on this entity. Entity changes ripple.

What to check, depending on what changes:

- **Attributes** — business kinds only (text, number, amount, date, period, yes_no, choice, reference, document,
  other), never storage types. A new required attribute must be captured by some capability (usually the one that
  creates the entity): update its "Data in / data out" and main flow. A removed attribute must disappear from every
  capability and screen that shows or uses it, including screen `fields`. Renaming an attribute means renaming it in
  every screen's `fields` too. A `reference` attribute says which entity it points to (`references`); a `choice`
  attribute lists its `options`.
- **Relationships** — a new relationship to another entity: check that entity exists and that someone sets the
  relationship (a capability's main flow).
- **States and transitions** — this is the risky part:
  - every transition must stay performed by at least one capability (`transitions` in that capability's
    `entities`); a new transition needs a capability that performs it, existing or new;
  - removing a state or transition breaks every capability that uses it: edit those capabilities in the same change,
    or keep the transition;
  - check rules that mention the state.
- **Title** — the title should stay the canonical glossary term; if the business name changes, change the glossary term
  too (`change edit <CHG> term:<Term>`), keeping the old word as a forbidden synonym.

The "Coverage" block is generated: never edit it. After the edit, `show <ENT>` (or `validate --change`) reports
uncovered transitions and lifecycle gaps; resolve them or list them as next steps.
