# alterspec shared rules (read by every alterspec command)

- **No technology in the spec.** Never write databases, tables, column types, endpoints, protocols, frameworks,
  libraries, programming languages or vendor products. Describe what the product does and why, in business terms.
  If the user gives technical detail, translate it into business language or record it as an open question.
- **Templates:** create files from `.alterspec/custom/templates/<name>` if it exists, otherwise
  `.alterspec/templates/<name>`. Replace every `{{placeholder}}`. Keep the guidance comments that are still useful.
- **IDs are stable and never reused.** To pick the next number, look at existing files and at `spec/changes/archive/`
  and use the highest number + 1. Formats: `MOD-<CODE>`, `CAP-<CODE>-NNN`, `SCR-<CODE>-NN` (shared screens:
  `SCR-GLB-NN` in module `MOD-GLB`), `ROLE-<NAME>`, `PER-<NAME>`, `ENT-<NAME>`, `RULE-NNN` (shared) or
  `RULE-<CODE>-NNN` (module), `FLOW-NNN`, `EVT-<NAME>`, `DEC-NNN`, `CHG-NNN`, acceptance criteria `<CAP>-AC-NN`.
  Codes are 2–6 uppercase letters.
- **Front-matter is authoritative.** Capability front-matter decides roles, screens, entities, rules, events and flows.
  Never hand-edit text between `<!-- GENERATED:start ... -->` and `<!-- GENERATED:end -->`.
- **Use canonical glossary terms** from `spec/application/glossary.md`, never the listed forbidden synonyms.
- **Ask, don't invent.** When business information is missing, ask the user (a few focused questions at a time).
  If they don't know, record an open question in the file and in `spec/application/decisions.md` as a
  `DEC-NNN` item with `kind: open_question`.
- **Referenced IDs must exist.** If you reference a role, entity, rule, screen or event that doesn't exist yet,
  tell the user and offer to create it.
- New objects start with `status: draft`.
- Finish with a short summary: files created or changed, and open questions left.
