# /alter-capability — create a capability

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: `<MOD> <title>`. Ask for whatever is missing.

A capability is **one user goal, done by one role, in one session**. If the user's description covers more than
that, propose splitting it.

1. Read the module (`spec/modules/<code>/module.md`), `personas-roles.md`, `glossary.md`, the module's screens and
   the entities it touches, so you reuse existing IDs.
2. Pick the next `CAP-<CODE>-NNN`.
3. Interview the user to fill, in this order:
   - persona-based user story and business value
   - roles and their scope (own / team / org / all)
   - preconditions and trigger
   - main flow, step by step, with the screen and action for each step
   - alternative and exception flows
   - data in and out (entity attributes), entity operations (C R U D A) and state transitions
   - business rules that apply (existing `RULE-*` or new ones)
   - notifications and events emitted or consumed
   - acceptance criteria (Given / When / Then), each linked to a rule or a main-flow step
   - what is out of scope
4. Create `spec/modules/<code>/capabilities/CAP-<CODE>-NNN.md` from the `capability.md` template. Every front-matter
   list must match the body.
5. List any referenced IDs that don't exist yet and offer to create them (`/alter-screen`, `/alter-entity`, or a
   new rule item in the right rules file).
