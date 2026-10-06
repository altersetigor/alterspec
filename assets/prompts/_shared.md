# alterspec shared rules (read by every alterspec command)

The CLI is `npx @alterset/alterspec`. Below it is written as `alterspec`; always run it as
`npx @alterset/alterspec ...` from the project root.

## What the spec is

- **No technology.** Never write databases, tables, column types, endpoints, protocols, frameworks, libraries,
  programming languages or vendor products. Describe what the product does and why, in business terms. If the person
  gives technical detail, translate it into business language, or record it as an open question.
- **Use canonical glossary terms** from `spec/application/glossary.md`, never their forbidden synonyms.
- **Front-matter is authoritative.** It decides roles, screens, entities, rules, events and flows. The body explains.
  Never edit text between `<!-- GENERATED:start ... -->` and `<!-- GENERATED:end -->`, or files in `spec/_generated/`.

## How you work with the person

- **Interview, then draft.** Ask at most 3 questions at a time. When the spec already suggests answers (existing roles,
  entities, rules), offer them as choices. Before writing, summarise what you understood in a few lines and let the
  person correct it.
- **Ask, don't invent.** Never fill a gap with a plausible guess. If the person doesn't know, record an open question:
  `alterspec new decision --title "<question>" --kind open_question --json`, add the object's ID to that item's
  `affects` list, and add a line under the object's "Open questions" section.
- **Granularity.** One capability = one user goal, done by one acting role, in one session. Propose a split when a
  description covers two goals, two acting roles, or work that pauses for someone else (an approval, a reply from a
  partner). Each part becomes its own capability, and the hand-over between them becomes a flow step or an event.
- **Status.** New objects start as `draft`. Only `/alterspec-refine` moves an object to `refined`, and only when it has no
  open gaps. Moving to `ready`, `approved` or `implemented` needs the person to say so explicitly; then raise
  `version` by 1.

## Baseline: changes go through change proposals

Check whether `spec/_generated/baseline.json` exists.

- **No baseline yet:** the first version is still being written. Edit `spec/` directly as described below. When the
  person says the first version is agreed, suggest `alterspec baseline` — never run it without their say-so.
- **Baseline exists:** every edit, including new objects, goes through a change proposal. Never edit `spec/` directly;
  `alterspec validate` reports direct edits as `direct-edit` errors.
  - Ask which open change to use (`spec/changes/CHG-*/proposal.md` with status `draft` or `in_review`), or start one
    with `/alterspec-change`.
  - Existing object: `alterspec change edit <CHG> <ID> --json`, then edit the copy it reports, under
    `spec/changes/<CHG>/spec/`. Glossary terms are `term:<Term>`; prose files are `file:<path>`.
  - New object: add `--change <CHG>` to `alterspec new`.
  - Removal: `alterspec change remove <CHG> <ID>`.
  - To change one existing object, the person can also use `/alterspec-change-module`, `-capability`, `-screen` or
    `-entity`; they follow these same rules.
  - Check with `alterspec validate --change <CHG>` instead of `alterspec show`.

## How you change files

- **Create objects only with `alterspec new <type> ... --json`.** It picks the next free ID, uses the right template
  and location, and registers modules and flows. Never pick an ID yourself or copy a template by hand.
  Types: `module --code --title`, `capability --module --title --role [--scope]`, `screen --module --title`,
  `entity --name --title`, `flow --title --capability`, `rule --title [--module]`,
  `event --name --title [--external]`, `persona --name --title [--role]`, `role --name --title`,
  `decision --title [--kind]`, `term --term [--forbidden a,b]`.
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
