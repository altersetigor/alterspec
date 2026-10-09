# alterspec shared rules (read by every alterspec command)

The CLI is `npx @alterset/alterspec`. Below it is written as `alterspec`; always run it as
`npx @alterset/alterspec ...` from the project root.

## What the spec is

- **No technology.** Never write databases, tables, column types, endpoints, protocols, frameworks, libraries,
  programming languages or vendor products. Describe what the product does and why, in business terms. If the person
  gives technical detail, translate it into business language, or record it as an open question.
  The one exception is `spec/experience/` (the experience layer): it may name components, layout and interaction
  details, but it never adds or changes business content. Only `/alterspec-experience` works there.
- **Use canonical glossary terms** from `spec/application/glossary.md`, never their forbidden synonyms.
- **Front-matter is authoritative.** It decides roles, screens, entities, rules, events and flows. The body explains.
  Never edit text between `<!-- GENERATED:start ... -->` and `<!-- GENERATED:end -->`, or files in `spec/_generated/`.

## The product profile

`spec/application/application.md` carries the product profile in its front-matter: `channels` (each with a `kind`,
and `responsive` or `offline` where it matters) and `profile` (`tenancy`, `languages` and `default_language`,
`currencies` and `default_currency`, `time_zones`). Read it before you interview.

- **Never ask about what the profile settles.** One currency: don't ask which currency an amount is in. One
  language: don't ask about translations. Single tenancy: don't ask about tenants. One time zone: don't ask how
  dates are shown elsewhere.
- **Don't specify what the profile excludes.** `alterspec validate` reports currency conversion, translation,
  tenants or time zones in the spec as `profile-excluded` when the profile rules them out. If the person wants such
  behaviour, the answer is an open question on `APP`, not a capability that quietly widens the product.
- **Changing the profile** is an edit of the application: `alterspec profile set ...` (with `--change <CHG>` after the
  baseline) and `alterspec new channel ...`. With several languages or currencies, a default is mandatory.
- **No profile yet** (`profile-missing`): run `/alterspec-init`, or ask the questions it asks and record the answers.

## How you work with the person

- **Starting from plain language.** The person may just say what they want; Claude Code then starts the matching
  alterspec skill from their words, or `/alterspec` routes them. Never start `/alterspec-init`, `alterspec baseline`,
  `/alterspec-apply` or `/alterspec-handoff` from your own reading of a sentence: the person types those.
- **One authoring mode: draft, mark, confirm once, execute.** Every business change, from an empty spec to one
  attribute, is a grooming proposal (`/alterspec-groom`): read the ground without asking, draft the whole thing,
  mark every fact that is neither in the idea nor in the spec as `(proposed)` and list it to confirm, ask once, and
  write nothing into the spec before the person says go. The interview happens inside the proposal, for what cannot
  be proposed. Only the experience skill still interviews, at most 3 questions at a time, because a design is
  confirmed by looking at it.
- **Ask, don't invent.** Never fill a gap with a plausible guess. If the person doesn't know, record an open question:
  `alterspec new decision --title "<question>" --kind open_question --json`, add the object's ID to that item's
  `affects` list, and add a line under the object's "Open questions" section.
- **Granularity.** One capability = one user goal, reached in one session, by the roles allowed to perform it (one or
  several, each with its own scope). Propose a split when a description covers two goals, or work that pauses for
  someone else (an approval, a reply from a partner). Each part becomes its own capability, and the hand-over between
  them becomes a flow step or an event. Several roles doing the same thing is one capability; one role handing over to
  another is two.
- **Status.** New objects start as `draft`. Only grooming an object to finish it moves it to `refined`, and only
  when it has no open gaps. Moving to `ready`, `approved` or `implemented` needs the person to say so explicitly;
  then raise `version` by 1.

## Baseline: changes go through change proposals

Check whether `spec/_generated/baseline.json` exists.

- **No baseline yet:** the first version is still being written. Edit `spec/` directly as described below. When the
  person says the first version is agreed, suggest `alterspec baseline` — never run it without their say-so.
- **Baseline exists:** every edit, including new objects, goes through a change proposal. Never edit `spec/` directly;
  `alterspec validate` reports direct edits as `direct-edit` errors.
  - Ask which open change to use (`spec/changes/CHG-*/proposal.md` with status `draft` or `in_review`), or start one
    (`alterspec change new --title "<why>"`; grooming does it with `--groom`).
  - Existing object: `alterspec change edit <CHG> <ID> --json`, then edit the copy it reports, under
    `spec/changes/<CHG>/spec/`. Glossary terms are `term:<Term>`; prose files are `file:<path>`.
  - New object: add `--change <CHG>` to `alterspec new`.
  - Removal: `alterspec change remove <CHG> <ID>`.
  - Check with `alterspec validate --change <CHG>` instead of `alterspec show`.

## How you change files

- **Create objects only with `alterspec new <type> ... --json`.** It picks the next free ID, uses the right template
  and location, and registers modules and flows. Never pick an ID yourself or copy a template by hand.
  Types: `module --code --title`, `capability --module --title --role [--scope]`, `screen --module --title`,
  `entity --name --title`, `flow --title --capability`, `rule --title [--module]`,
  `event --name --title [--external]`, `persona --name --title [--role]`, `role --name --title`,
  `decision --title [--kind]`, `term --term [--forbidden a,b]`,
  `channel --name --kind [--audience] [--responsive|--no-responsive] [--offline]`.
- **Shared or module rule?** A rule used by one module only is a module rule (`--module`). A rule two modules share
  is an application rule (no `--module`).
- **Then edit** the file `new` reported: fill front-matter lists and body sections. Keep YAML valid. Keep the template's
  section headings; write "None." in a section that really has nothing, rather than deleting it.
- **References must exist.** Before referencing a role, entity, rule, screen or event, check that it exists
  (`alterspec show <ID>`). If not, ask whether to create it, then use `new`.
- **After every change:** run `alterspec views`, then `alterspec show <ID>` for each object you touched. Fix every
  error it lists before you finish. Mention remaining warnings to the person.

## Finishing

End with a short summary: objects created or changed (ID and title), open questions recorded, and the suggested next
command.
