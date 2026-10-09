# Entities (reference for grooming)

What a proposal must say about a business entity, how it is written, and what to check when one changes. Read by
`/alterspec-groom`; never a skill of its own.

## What a proposal says about an entity

1. what the thing is in the business, and who cares about it; its title is a canonical glossary term (propose the
   term if the glossary lacks it)
2. its business attributes: name, kind (text, number, amount, date, period, yes_no, choice, reference, document,
   other), whether required, a short description. Never storage or technical types. For a `reference`, which entity
   it points to (`references`); for a `choice`, the values a person can pick (`options`). Only when the profile says
   `localised_content: true`: which text attributes are translated
3. relationships to other entities (one or many)
4. its lifecycle: business states, the initial state, and which state changes are allowed
5. who creates it, views it, changes it, and archives or deletes it: every transition must be performed by at least
   one capability, and someone must create, read, update and archive or delete the entity. Uncovered transitions
   and operations are proposed as capabilities, or listed as open questions

## Writing a new entity

1. `alterspec new entity --name <NAME> --title "<title>" --json` (NAME in upper case, words joined with `-`; with
   `--change <CHG>` after the baseline). Glossary term: `alterspec new term --term "<Term>" --forbidden "<a>,<b>"`.
2. Fill the front-matter (`attributes`, `relationships`, `states`, `initial_state`, `transitions`) and the body
   sections: Description, Attributes (only what needs more than the front-matter), Lifecycle (each state and what
   moves the entity between states).
3. `alterspec views` and `alterspec show <ENT>` (or `validate --change <CHG>`); the uncovered transitions and
   operations it reports are capabilities still to propose.

## Changing an existing entity

Run `alterspec show <ENT>` first: "Referenced by" lists every capability, rule, event and decision that depends on
the entity. Entity changes ripple; every ripple is part of the same proposal.

- **Attributes** — business kinds only. A new required attribute must be captured by some capability (usually the
  one that creates the entity): its "Data in / data out" and main flow change too. A removed attribute disappears
  from every capability and screen that shows or uses it, including screen `fields`. Renaming an attribute renames it
  in every screen's `fields`. Screens that show the entity may have experience screens: after renaming, removing or
  re-typing an attribute they show, they must follow (`alterspec experience sync <SCR>` before the baseline,
  `alterspec change sync <CHG>` after it).
- **Relationships** — a new relationship: the other entity exists, and some capability's main flow sets it.
- **States and transitions** — the risky part: every transition stays performed by at least one capability; a new
  transition needs a capability that performs it, existing or new; removing a state or transition breaks every
  capability that uses it, so those capabilities change in the same proposal; rules that mention the state are
  checked.
- **Title** — stays the canonical glossary term; if the business name changes, the glossary term changes too
  (`change edit <CHG> term:<Term>`), keeping the old word as a forbidden synonym.
- **Status** — an edit that reopens questions on a `refined` or later entity sets it back to `draft`; say so.

The "Coverage" block is generated: never edit it. After the edit, `show <ENT>` (or `validate --change`) reports
uncovered transitions and lifecycle gaps; resolve them in the proposal or list them as open questions.

## Finishing an entity (gap analysis)

The analyst checks that reference attributes say what they reference, choice attributes list their options, every
state is reachable and every transition is performed by a capability, and that the description says who cares
about the entity and why.
