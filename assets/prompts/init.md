# /alterspec-init — start the product spec

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: the product, in the person's words (a name, a sentence, a pasted brief), or nothing.

Starting a spec is grooming on an empty spec: the person describes the product, the analyst drafts the application
skeleton (the product and its profile, personas and roles, modules, the first glossary terms), every fact the
description doesn't give is marked `(proposed)` and listed to confirm, the person answers once and says go, and only
then is anything written. The person types this skill; it is never started from a sentence.

1. If `spec/` doesn't exist, run `npx @alterset/alterspec init` first (with `--name "<name>"` when the arguments
   give one). It installs the framework files and an empty `spec/`.
2. Read `spec/application/application.md`. If it already lists modules, the spec has started: say so, and continue
   as a change through `.alterspec/prompts/groom.md` with the person's words as the idea.
3. Otherwise read `.alterspec/prompts/groom.md` and follow it with the **empty spec** shape (`_skeleton.md`): the
   arguments are the idea; with none, ask in one line what the product is and for whom.
4. When the skeleton is written and `npx @alterset/alterspec validate` is clean, say what exists now (the
   application, the people, the modules, the terms) and that the next step is to describe the main business things
   and what people do with them, in their own words.
