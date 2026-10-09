# /alterspec — the front door: say what you want, in your words

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: whatever the person said, or nothing. This prompt also applies when Claude Code picked this skill from a
plain sentence about the product ("I want to add gender to buyer", "what can a sales rep do with a price?").

The person should not need to know skills, agents, IDs or file names. You find what their words refer to, decide
whether they are asking or changing, and either answer from the spec or hand over to the one alterspec skill that
does that kind of change. Nothing below edits the spec itself.

## 1. Find what the words refer to

1. Map product words to spec objects: `npx @alterset/alterspec show <ID>` when an ID or title is recognisable,
   otherwise look in `spec/application/glossary.md`, the entity and module titles (`spec/application/entities/`,
   `spec/modules/*/module.md`), capability and screen titles (`spec/modules/*/capabilities/`, `.../screens/`).
2. If two objects fit equally, ask one question naming the candidates. Otherwise don't ask; say in one line which
   object you understood ("Buyer is `ENT-BUYER`; I'll change it.") and go on.
3. If nothing fits and the person wants to change something, it is a new object or a feature (step 2).

## 2. Route

| The person…                                                                                          | Do this                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| asks a question: what, who, how, which, is it ready, what is open, show me                           | Answer from `show`, `validate`, the files. Product language; IDs only when asked. Never edit.           |
| wants one existing entity, capability, screen or module to change                                    | Invoke `alterspec-change-entity`, `alterspec-change-capability`, `alterspec-change-screen` or `alterspec-change-module` with the ID, and pass the person's words as the first answer. |
| wants a new entity, capability, screen or module with a clear home                                   | Invoke `alterspec-create-entity`, `alterspec-create-capability` or `alterspec-create-screen` (both need the module) or `alterspec-create-module`.    |
| presents an idea or a feature to work out, in a sentence or a pasted brief                            | Invoke `alterspec-groom` with their words: it drafts the whole proposal, asks once, executes on their go. |
| wants to continue a change proposal (`CHG-…`), or lists several known edits to steer one by one      | Invoke `alterspec-change` with the `CHG-…` ID or a short title made from their words.                    |
| wants an object finished, completed, or asks what is missing in it                                   | Invoke `alterspec-refine` with the ID.                                                                   |
| talks about looks, layout, labels, components, states, demo data, the mockups or the app             | Invoke `alterspec-experience` with the screen ID (or `init`, `review <SCR>`, `sync <SCR>` as fits).     |
| asks whether the spec is correct, consistent or complete                                             | Invoke `alterspec-validate` (optionally scoped) and summarise.                                           |
| says the generated views, matrices or wireframe are out of date (or `validate` reported `views-stale`) | Invoke `alterspec-views`. |
| asks what a change affects                                                                           | Invoke `alterspec-impact` with the `CHG-…` ID.                                                           |
| says approve, apply, merge, hand off, deliver, baseline, install, init                               | Don't run anything. Tell them the exact command to type (`/alterspec-apply CHG-…`, `/alterspec-handoff CAP-…`, `npx @alterset/alterspec baseline`, `/alterspec-init`) and in one line why it stays theirs: merging, delivering and freezing the spec need the person's own word. |

Rules of thumb:
- "Add X to Y" where Y exists is a change of Y, not a new object. "We need a Y" where Y doesn't exist is new.
- One attribute, one action, one rule: the single-object skill. An idea to work out (a feature, a goal, a brief):
  `alterspec-groom`. A list of known edits across several objects, or an open `CHG-…`: `alterspec-change`.
- When it is genuinely unclear whether the person wants a change or a new object, ask one line, then route.
- After the baseline, the skill you invoke handles the change proposal; don't start one yourself here.
- Never invoke a skill the person's words don't call for, and never invoke `alterspec-init`, `alterspec-apply` or
  `alterspec-handoff`.

## 3. Answering questions

Answer as a product person would read it: what the thing is, who may do it, what the rules are, what is still
open. Use `show` for one object, `validate` for health, `spec/_generated/` matrices for "who can do what". Quote
the spec's own wording where it matters. Offer the next step in one line ("Say the word and I'll add it.") without
taking it.

## 4. Finishing

When you routed: nothing more, the skill you invoked finishes as `_shared.md` says. When you answered: end with what
the person could do next, in their words, not in commands.
