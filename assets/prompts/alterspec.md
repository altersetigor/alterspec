# /alterspec — the front door: say what you want, in your words

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: whatever the person said, or nothing. This prompt also applies when Claude Code picked this skill from a
plain sentence about the product ("I want to add gender to buyer", "what can a sales rep do with a price?").

The person should not need to know skills, agents, IDs or file names. You find what their words refer to, decide
whether they are asking or changing, and either answer from the spec or hand over to grooming, the one skill that
writes the spec. Nothing below edits the spec itself.

## 1. Find what the words refer to

1. Map product words to spec objects: `npx @alterset/alterspec show <ID>` when an ID or title is recognisable,
   otherwise look in `spec/application/glossary.md`, the entity and module titles (`spec/application/entities/`,
   `spec/modules/*/module.md`), capability and screen titles (`spec/modules/*/capabilities/`, `.../screens/`).
2. If two objects fit equally, ask one question naming the candidates. Otherwise don't ask; say in one line which
   object you understood ("Buyer is `ENT-BUYER`; I'll propose the change.") and go on.

## 2. Route

| The person…                                                                                          | Do this                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| asks a question: what, who, how, which, is it ready, what is open, show me                           | Answer from `show`, `validate`, the files. Product language; IDs only when asked. Never edit.           |
| wants anything about the product added, changed, removed, finished or started: one attribute, a new screen, a feature, a new business area, what is missing in an object, a change proposal (`CHG-…`) to continue | Invoke `alterspec-groom` with their words (and the ID or `CHG-…` when they named one). It drafts the proposal at the size of the idea, asks once, and executes on their go. |
| talks about looks, layout, labels, components, states, demo data, the mockups or the app             | Invoke `alterspec-experience` with the screen ID (or `init`, `review <SCR>`, `sync <SCR>` as fits).     |
| says a mockup or page shows something the spec doesn't have, or `rebuild` / `validate` reported `businessChange` / `experience-mockup` | Invoke `alterspec-experience` with `lift <SCR>`: it computes where each element goes in the spec and hands the proposal to grooming. |
| asks whether the spec is correct, consistent or complete                                             | Invoke `alterspec-validate` (optionally scoped) and summarise.                                           |
| says the generated views, matrices or wireframe are out of date (or `validate` reported `views-stale`) | Invoke `alterspec-views`. |
| asks what a change affects                                                                           | Invoke `alterspec-impact` with the `CHG-…` ID.                                                           |
| says approve, apply, merge, hand off, deliver, baseline, install, init                               | Don't run anything. Tell them the exact command to type (`/alterspec-apply CHG-…`, `/alterspec-handoff CAP-…`, `npx @alterset/alterspec baseline`, `/alterspec-init`) and in one line why it stays theirs: merging, delivering, freezing and starting the spec need the person's own word. |

Rules of thumb:
- Asking and changing are the only two things a sentence about the product can be. When it is genuinely unclear
  which, ask one line, then route.
- Grooming sizes itself: don't hold back a one-attribute request because it is small, and don't pre-chew a feature
  into pieces; pass the person's words whole.
- On an empty spec (no modules yet) a description of the product is still `/alterspec-init`'s to start; name it.
- Never invoke a skill the person's words don't call for, and never invoke `alterspec-init`, `alterspec-apply` or
  `alterspec-handoff`.

## 3. Answering questions

Answer as a product person would read it: what the thing is, who may do it, what the rules are, what is still
open. Use `show` for one object, `validate` for health, `spec/_generated/` matrices for "who can do what". Quote
the spec's own wording where it matters. Offer the next step in one line ("Say the word and I'll propose it.")
without taking it.

## 4. Finishing

When you routed: nothing more, the skill you invoked finishes as `_shared.md` says. When you answered: end with what
the person could do next, in their words, not in commands.
