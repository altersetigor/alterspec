# alterspec: what it is and how it works

alterspec is a product specification framework for teams that deliver software with AI. It keeps one
technology-agnostic product spec as the single source of truth, lets the spec change with the product through
reviewed change proposals, projects it into a generic wireframe and a working mockup app (the **experience**, how the
product looks and behaves), and hands it to the development team as a self-contained bundle. It is published as `@alterset/alterspec` and runs inside Claude Code.

This document explains the idea and the mechanics at a high level. It focuses on three things: the philosophy, how
spec changes stay consistent across the whole spec tree and reach the experience layer, and how changes made in the
experience layer travel back up the tree.

## 1. The spec tree

The **spec tree** is the whole set of spec objects in `spec/` together with the references between them, read as
one tree whose root is the Application. Every object is a Markdown file with a stable ID and YAML front-matter.

**Front-matter** is the structured header at the top of each file: a YAML block between two `---` lines holding
the object's ID, title, status and its references to other objects (roles, screens, entities, rules). The Markdown
body below it explains in prose. The CLI validates, cross-checks, generates from and fingerprints the front-matter;
the body is for people. That is what "front-matter is authoritative, prose explains" means throughout this document.

```text
Application  APP                      what the product is, its profile, and the shared vocabulary
│  personas PER-*, roles ROLE-*, glossary, entities ENT-* (with lifecycles), shared rules RULE-NNN,
│  flows FLOW-*, events EVT-*, integrations, quality requirements, decisions DEC-*
│
├── Module  MOD-<CODE>                a business area with its own rules RULE-<MOD>-NNN
│   ├── Capability  CAP-<MOD>-NNN     one user goal: roles + scopes, screens, entities + transitions,
│   │                                 rules, events, acceptance criteria CAP-…-AC-NN
│   └── Screen  SCR-<MOD>-NN          what people see and do: fields per entity, actions → capabilities,
│       │                             roles, channels, states
│       └── Experience  UX-SCR-…      how the screen looks and behaves, plus its mockup page
│                                     (realises the screen's elements exactly, nothing more)
└── Generated views  _generated/      matrices, traceability, coverage, wireframe, spec.js
                                      derived from front-matter, never edited by hand
```

Three properties make it a tree rather than a folder of documents:

- **Stable identity.** IDs are never renumbered or reused. A reference is a promise the linter checks.
- **Closed loops.** Every reference between levels must close: a screen action is a capability one of the screen's
  roles may perform, a shown field is an attribute the entity has, an entity transition is performed by some
  capability, a consumed event has an emitter, every capability sits in a flow.
- **One direction of truth.** Front-matter at each level is authoritative. Everything derivable from it, down to
  the wireframe and the data the mockups load, is generated. Changes flow down the tree automatically. Changes
  born at the bottom never climb on their own: the CLI computes their path up the tree, the person confirms once,
  and the edits are made at the business level and flow down again.

**Generated views** (`_generated/`) are the spec seen across objects, computed by `alterspec views` from the
front-matter and never hand-edited. Half of it is for people: the role matrix ("what can an accountant do?"),
traceability and coverage (does every criterion trace to a flow, is every rule and transition covered), the
wireframe (what the spec says a screen shows, with "Not specified" where it says nothing), and the `GENERATED`
blocks inside module and screen files. The other half is for the tools: the ID index the skills read, the spec data
the mockup app loads, the baseline fingerprints the change flow compares against. None of it is needed for the spec
to be correct; it is how a person reads the spec without doing the joins in their head, and how the tools avoid
re-deriving it on every call. `views --check` fails when it is stale, and re-running `views` reproduces it exactly.

## 2. Philosophy and approach

**The spec changes with the product.** Code has become cheap to produce. The scarce asset is a clear, current,
agreed description of what the product does. alterspec treats that description as the asset: one source of truth,
changed only through proposals, checkable by people and by machines.

**Business language only.** The spec names personas, roles, entities, rules, flows and screens. It never names a
database, an endpoint, a framework or a library. The technical plan and tasks belong to the development team;
alterspec delivers the spec to them and never grows a technology layer of its own. The one deliberate exception is
the experience layer, which may talk about components, layout and interaction, but never about business content
the business spec lacks.

**Front-matter is authoritative, prose explains.** Who may do what, which screens show which data, which
transitions a capability performs: all of it is structured data in the YAML front-matter. Module capability lists,
role matrices, screen back-references, entity coverage, traceability, the wireframe and the mockup data are
generated from it into marked blocks (`<!-- GENERATED:start … -->`) that carry a hash. A hand edit of a generated
block is a lint error.

**Draft, mark, confirm once.** There is one way the spec is written, whatever the size of the request. The analyst
reads the ground (the spec as it is) and drafts the whole proposal: for one attribute a few lines, for a feature
every section, for an empty spec the application skeleton. Every fact that is neither in the person's words nor in
the spec is marked `(proposed)` and repeated in a "To confirm" list; what the analyst chose not to propose is listed
with its reason; what nobody can answer is an open question. The person corrects and answers once, in plain words,
and says go. Nothing is written before that. The interview still exists, but inside the proposal, for what cannot
be proposed: the model never fills a gap with a plausible guess, and an unanswered question becomes a `DEC-*` open
question attached to the object, which cannot advance until it is answered.

**Status is earned.** `draft → refined → ready → approved → implemented`. Refinement may reach `refined` on its
own; every step beyond needs the person's explicit word.

**Deterministic core, model at the edges.** The CLI owns everything that must be the same every time: IDs, file
locations, templates, schema validation, the lint rules, generation, fingerprints, merging, handoff rendering. All
of it runs in CI without Claude. The Claude Code skills and agents own conversation and judgement: interviewing,
drafting, semantic review, shaping a design. The model never picks an ID, never copies a template, never edits a
generated block, never approves a change.

**Change by proposal.** Until the first version is agreed, the spec is edited freely. Then `baseline` records a
fingerprint of every object and the main spec becomes read-only for people. From then on every edit is a change
proposal (`CHG-NNN`) holding copies of only the touched objects, validated as the spec it would produce, reviewed
for impact, approved by a person naming the change, and merged by the CLI. It is version control at the level of
product decisions rather than lines.

**The UI is a projection, not a second spec.** A generic wireframe is generated from the business spec and is
always current. The experience layer realises exactly what the wireframe shows, element for element, and the checks
allow zero deviation. Developers receive a screen only when its experience is reviewed and clean; there is no
override.

**Nothing is specified that the product doesn't need.** The product profile (channels, tenancy, languages,
currencies, time zones) is recorded at the start. Every proposal reads it and never asks what it settles; the
linter reports multi-currency, translation, tenant or time-zone content in a product whose profile excludes it.

## 3. How it works, at a high level

### 3.1 The pieces

| Piece | Lives in | Role |
| --- | --- | --- |
| The spec | `spec/` | The product, owned by the team, committed to git |
| The CLI | `npx @alterset/alterspec …` (the local install, from this repository; not on npm) | Deterministic work: `init`, `new`, `validate`, `views`, `baseline`, `change`, `impact`, `apply`, `experience`, `handoff` |
| Skills | `.claude/skills/alterspec-*` | Nine thin wrappers around prompts in `.alterspec/prompts/`: the front door and grooming (the one that writes), validate, views and impact (the checks), init, apply and handoff (the gates the person types), experience (design) |
| Agents | `.claude/agents/alterspec-*` | Analyst (gap analysis, drafting), reviewer (read-only findings), UX designer (experience files only), experience reviewer (read-only parity table) |
| Framework files | `.alterspec/` | Templates, schemas, prompts, config; replaced by `update`, except `custom/` |

### 3.2 The lifecycle

1. **Start.** `alterspec init` installs the framework; `/alterspec-init` with a description of the product grooms
   the skeleton: application and profile, personas and roles, one module per business area, the first glossary
   terms. Asked once, written on go.
2. **Author.** Every sentence about the product is a grooming proposal: a new entity, a capability, a screen, one
   attribute, "finish the order capability". The proposal is sized to the sentence, confirmed once, executed by
   the CLI. `/alterspec-validate` runs the deterministic rules and the reviewer agent at any time.
3. **Design.** `alterspec views` generates the wireframe. `/alterspec-experience` drafts a UX contract and a working
   mockup page per screen, the designer shapes them, the experience reviewer produces a parity table.
4. **Freeze.** `alterspec baseline` when the first version is agreed.
5. **Change.** The same sentences, now executed into a change proposal: copies of touched objects, validation of
   the resulting spec, `change sync` so the experience follows, `impact`, review, approval by name, `apply`.
6. **Deliver.** `apply` hands off every capability of the change that is `ready` with reviewed screens, and
   refreshes bundles whose sources moved. `handoff` remains for whole modules and early looks.

### 3.3 One way in

The person never needs to know a skill name. Every sentence about the product goes to the front door, `/alterspec`,
which does one of two things: answer from the spec, or hand the words to grooming. Grooming reads the ground before
it asks anything, and the shape of the ground sizes the proposal:

| The ground | What the proposal is |
| --- | --- |
| An empty spec | The application skeleton: product and profile, personas and roles, modules, first terms |
| One object to finish ("what is missing in the buyer entity?") | Its gaps, each with a proposed answer or an open question; `refined` when nothing stays open |
| One object to change or add ("add gender to buyer", "we need a Supplier") | A few lines, plus the knock-on edits of everything that references it |
| A feature or a business area | The full proposal: where it lives, entities, capabilities, screens, rules, flow steps, what was not proposed |
| A change to continue (`CHG-…`) | What is still open in its document, then execution |
| A mockup that shows what the spec lacks | The path of each marker up the tree, computed by `experience lift` (section 5) |

In every case the person reads one message in their own language, corrects it as many times as they like, answers
what they know, and says go. Design is the one exception to the document: the designer drafts the page and the
person confirms by opening it and signing in as each role. What the person still types, because each is a
decision and not a draft: installing the framework and `/alterspec-init`, `baseline` when the first version is
agreed, "approve CHG-…" at `apply`, and handing off a whole module.

## 4. Spec changes: consistency across the tree, and reaching the experience

Information flows one way: **business spec → generated views → wireframe → experience → handoff**. This section
follows a change from the top down and shows what keeps each level consistent with the one above.

### 4.1 Consistency inside the business spec

Consistency is not a convention; it is enforced by three mechanisms that run on every `validate`.

**Generation.** Front-matter is written once, at the object that owns the fact, and projected everywhere else:

| Written once in | Generated into |
| --- | --- |
| `CAP-*` front-matter: `module`, `roles`, `screens`, `entities` | Module capability list, role matrix, screen back-references ("used by"), entity coverage |
| `SCR-*` front-matter: `fields`, `actions`, `roles` | Screen capability list, wireframe page, `spec.js` for the mockups |
| `ENT-*` attributes and lifecycle | Entity coverage, wireframe field rendering, demo data shape |
| Flows and events | Traceability matrix |

`views --check` fails when any generated block is out of date (`views-stale`) or hand-edited (`generated-edited`).

**Reference checks.** Every ID a document mentions must exist (`unknown-reference`, `duplicate-id`,
`id-location`), and the references must close loops between levels:

| Rule | The loop it closes |
| --- | --- |
| `screen-role-action` | every screen action is a capability one of the screen's roles may perform |
| `screen-field-attribute` / `screen-field-op` | every shown field is an attribute the entity has, and edited data is created or updated by one of the screen's actions |
| `transition-coverage` / `lifecycle-coverage` / `invalid-transition` | every entity transition is allowed by the lifecycle and performed by some capability |
| `event-consumed-without-emitter` / `event-emitted-not-consumed` | every event has both ends |
| `capability-without-flow` / `flow-backlink` / `screen-backlink` | every capability is in a flow, and back-references agree with forward references |
| `orphan-entity` / `orphan-screen` | nothing exists that nobody uses |
| `foreign-module-rule` | a capability using another module's rule is flagged |
| `glossary-forbidden` / `tech-leak` / `profile-excluded` | one vocabulary, no technology, nothing the profile excludes |

**Semantic review.** The reviewer agent adds what no rule can see: contradictions between rules, data a screen needs
that no capability produces, permission holes, untestable acceptance criteria. It is read-only by construction.

### 4.2 A change travelling down the tree

Take a typical business change: a capability gains a new field that must be shown on its screen.

1. **A change proposal opens.** `alterspec change edit CHG-NNN ENT-…` copies the entity into
   `spec/changes/CHG-NNN/spec/` at its normal path, remembering the fingerprint it started from. The screen and
   capability are copied the same way. The main spec is untouched; a direct edit there is a `direct-edit` error.
2. **The levels are edited top down.** The attribute is added to the entity; the screen's `fields` name it; the
   capability's data section and acceptance criteria mention it. `validate --change CHG-NNN` validates the spec as
   it would be after the change, so an attribute named on the screen before it exists on the entity is caught at
   once.
3. **Generated views move.** Inside the change, the module blocks, matrices, coverage, the wireframe page and
   `spec.js` are recomputed from the new front-matter. Nobody edits them.
4. **The experience is told.** Each experience contract records `dry`, the fingerprint of the wireframe page it
   was aligned with. That fingerprint covers only what an experience realises: title, roles, groups and fields,
   actions with labels and capabilities, states. The new field changes it, so the contract is now `experience-stale`.
5. **`alterspec change sync CHG-NNN` makes the experience follow.** In one command, inside the change:
   - stale contracts are re-synced: elements the screen no longer has are dropped, new ones are added as drafts to
     place, states and default views appear for new roles, visibility (`data-roles`) is updated, and the new `dry`
     fingerprint is recorded;
   - screens the change adds or modifies that have no experience yet get a drafted contract and page;
   - experiences of screens the change removes are recorded as removed, with their pages.
   The page gets the new element in an "Added by sync" block carrying a `data-src` marker the spec recognises. A
   page a person designed is only edited this way; nothing is rendered over it.
6. **The designer places it.** The UX designer agent, or the person, moves the new element into the right region
   with the right component and label. Any edit after the last clean review turns on `experience-unreviewed`.
7. **Review.** `/alterspec-experience review SCR-…` produces a parity table (business spec, contract, mockup,
   verdict per element). Only a clean table lets `experience reviewed` record the new review fingerprint.
8. **Gates.** `change status in_review` and `approved` are refused while any experience in the change is stale,
   orphaned, or belongs to a `ready` screen without an experience. `/alterspec-impact` lists every object that
   references what changed, the flows and acceptance criteria affected, the generated views that will move, the
   findings introduced or resolved, and an "Experience screens" section (to align, to draft, to drop, to review).
9. **Apply.** With the person's approval by name, `apply` merges every copy, raises `version` on each modified
   object, regenerates all views, updates the baseline, archives the proposal, and hands off every touched
   capability that passes the gate: no lint errors, status `ready`, every screen's experience ready, reviewed and
   finding-free. Bundles already delivered whose sources moved are refreshed. What is not handed off is reported,
   with the reason.

### 4.3 What keeps the experience glued to the business spec

- Every business element of a screen has a stable marker, `data-src="SCR-PRC-01.A01"`. The contract must list each
  marker exactly once and nothing else (`experience-elements`); the page must carry each marker exactly once and
  nothing else (`experience-mockup`); the text inside must contain the declared label (`experience-labels`); every
  declared state must be marked in the page (`experience-states`); narrowed elements carry the right roles. These
  are errors, not warnings.
- `dry` says whether the contract still matches the wireframe; `reviewed` says whether the contract and page are
  still what the reviewer saw. Both are fingerprints the CLI records, never the person.
- Handoff refuses any screen whose experience is not ready, reviewed and finding-free. There is no flag to skip it.

## 5. Experience changes: carrying a design edit up the tree

Nothing climbs back up silently. What alterspec does is notice every hand edit, classify it, and refuse to let
business content live only in a mockup. If an edit means the product itself changed, `experience lift` computes
where in the tree it goes, the person confirms the facts only they know, once, and the change is executed at the
business level and brought back down.

### 5.1 What happens the moment a page or contract is edited

- The contract, the page, `config.js`, `data.js` and the kit are spec objects with fingerprints. After the baseline
  an edit in the main `spec/experience/` is a `direct-edit` error; the edit belongs in a change, and
  `change edit CHG-NNN UX-SCR-…` copies the contract and its page together.
- Any edit after the last clean review turns on `experience-unreviewed`. The screen cannot be handed over until the
  parity review passes again.
- `experience rebuild SCR-…` on a hand-edited page never overwrites it. It writes the CLI's fresh render to
  `_generated/experience/rebuild/` and sorts the difference into three bins: `businessChange` (markers the business
  spec doesn't have), `findings` (contract or page checks) and `kitOutdated` (runtime to merge by hand). Empty bins
  mean the page carries design edits only.

### 5.2 Three kinds of edit, and where each one lands

| Kind | Examples | Where it lands |
| --- | --- | --- |
| **Design only** | layout, components, icons, spacing, label and message wording, demo data, app name and brand | Experience layer only: the contract decides labels and components, the page follows. Re-review, apply. The business spec is not opened. |
| **Visibility of something the spec already has** | an element one role should not get is hidden or disabled with a reason | Still the experience layer: who may perform the action is already in the capability; the design decides how the refusal looks. If the roles themselves are wrong, it is kind 3. |
| **Business content** | a field not in the screen's `fields`, an action not in its `actions`, a filter, a state, a message that encodes a rule, a role that does not exist | Rejected on the page (`experience-mockup`) and on the contract (`experience-elements`), or named by the parity table as "mockup shows, spec lacks". It goes into the business spec first, then `sync` brings it down. The designer agent cannot touch `application/` or `modules/`. |

### 5.3 The path up the tree, computed

Every business element of a page carries a `data-src` whose grammar says where it lives: `SCR.ENT-X.Attr` is a field
of entity X, `SCR.A03` an action, `SCR.role.ROLE-Y` a role, `SCR.entry.N` an entry point. So for every marker the spec
lacks, the path up the tree is deterministic, and `alterspec experience lift <SCR>` computes it: which objects, at
which levels, under which names, the check that fires while a level is still missing, candidates that may already be
what was meant (an attribute spelled differently, a capability of the module the screen's roles may perform), and the
facts only the person can give. The table below is what it computes. Most UI-born changes stop at the screen or the
entity.

| Level | What the design needed | Where it goes, and what checks it |
| --- | --- | --- |
| Screen `SCR-…` | a shown field, an action, a filter, an empty or error state | `fields`, `actions`, `states` of the screen. `screen-field-attribute` demands the attribute exists on the entity; `screen-role-action` demands the action is a capability one of the screen's roles may perform. |
| Entity `ENT-…` | the field is not an attribute; a new lifecycle state | attribute (business kind, options, references) or lifecycle. `transition-coverage` demands some capability performs every new transition. |
| Capability `CAP-…` | the action has no capability; a new exception, rule, permission or acceptance criterion | roles and scopes, screens, entities, transitions, acceptance criteria. `capability-without-flow` asks for a flow step. |
| Module `MOD-…` | a module-own rule; a new capability or screen in the area | `modules/<mod>/rules.md`; `module.md` itself is not edited, its lists are regenerated. `foreign-module-rule` warns when a rule is borrowed. |
| Application | a new role or scope, a term, a shared rule, an event, an integration, a flow step, a quality requirement, a decision | the application files. `unknown-reference` and `glossary-forbidden` connect them to the lower levels. |
| `application.md` | the product's scope, channels or the problem it solves | Rare, and a sign the change should have started as a business change rather than on a page. |

What `lift` does not do is decide content. The business kind of a field, whether it is required, which capability an
action performs or whether it needs a new one, a role's scope: these are product decisions, and the markers cannot
tell them. The split is the same as everywhere in alterspec: the CLI owns the walk, the person owns the facts.

### 5.4 Lifting: asked once, executed on "go"

The upward flow follows the grooming pattern with a different input: the mockup diff instead of a sentence.

1. **Compute.** `alterspec experience lift SCR-… --change CHG-…` lists every foreign marker with its path and what to
   confirm, and writes a grooming document into the change whose idea is the brief: "The mockup of SCR-PRC-01 shows,
   and the spec lacks: a field "Margin" of Price (ENT-PRICE has no such attribute); an action A03 "Reject" with no
   capability to perform yet." The business spec is not touched. Markers it cannot read (a marker of another
   screen, a design state written as a `data-src`) are reported as such and must be fixed on the page.
2. **Draft.** The analyst agent, in proposal mode, fills the document: the entity and screen edits of each row, an
   existing capability where the candidates fit or a new one with its flow step, open questions for what nobody can
   answer. The names the markers fix are never renamed and never marked `(proposed)`; everything else that is not
   in the spec is, and is repeated under "To confirm".
3. **Confirm, once.** The person reads it in plain words, corrects, answers what they know, and says go. Or no: the
   change is rejected and the document stays as the record.
4. **Execute.** The same CLI commands grooming uses, inside the change and in dependency order: entities and roles,
   rules, screens, capabilities with their bodies, flow steps, open questions. Then `change sync`: the elements the
   designer already placed keep their markers, so nothing lands in "Added by sync" for them; only what the person
   added beyond the mockup does. Validate until clean, impact, the reviewer, `in_review`.
5. **Review and apply.** `/alterspec-experience review` until the parity table is clean; `/alterspec-apply` with the
   person's word merges every copy, raises `version` on each modified object across the levels touched, regenerates
   the module blocks, matrices, wireframe and `spec.js`, updates the baseline and archives the proposal. The
   designed page is kept exactly as left; `rebuild` will not replace it.

`/alterspec-impact` lists every object that references what changed, and the reviewer agent adds what no rule can
see: a contradiction with a rule, a permission hole, data the new field needs that nobody produces.

What cannot happen along the way: a page with business content the spec lacks reaching developers, `rebuild --force`
erasing a design without the person saying so, an agent editing the business spec from inside a design session, or
`lift` writing anything into the business spec before the person's go.

## 6. Summary

- The **spec tree** is Application → Module → Capability and Screen → Experience, with generated views alongside.
  Stable IDs and closed reference loops make it a tree; front-matter at each level is the only place a fact is
  written.
- **One way in.** Every business change is a grooming proposal: drafted from the ground at the size of the
  request, marked, confirmed once, executed by the CLI. The person types only decisions: install, baseline,
  approval, module handoff.
- **Spec changes** flow down automatically: front-matter → generated blocks → wireframe → experience fingerprints →
  `change sync` → review → apply → handoff. Every step is gated by a deterministic check, and the person's word is
  needed only where a decision is theirs: `ready`, approval, apply.
- **Experience changes** never flow up silently. Design-only edits stay in the experience layer. Business content
  is rejected until it exists in the business spec; `experience lift` computes its path up the tree from the
  markers, the person confirms the facts once, the change is executed at the business level, and the elements come
  back down through `sync` with the markers the designer already gave them.
