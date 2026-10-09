# alterspec: a guide for product owners

alterspec helps you write a product specification that is clear, complete and always up to date, and hand it to
the people who build the product. You write it by talking to Claude in plain language. alterspec keeps the spec
consistent, checks it, shows it to you as clickable screens, and remembers every change you agreed to.

This guide explains what the spec is made of, how you work with it day to day, and what alterspec does for you
behind the scenes. You do not need to be technical. You need to know your product.

## 1. Why a spec, and why this one

Software is cheap to produce now. What is scarce is a clear, current, agreed description of what the product does.
A spec that lives in slides and chat threads goes stale the week after it is written. alterspec treats the spec as
the asset: one place where the product is described, kept current as the product changes, and checked so that
nothing contradicts anything else.

Three promises:

- **It is about the product, not the technology.** The spec talks about people, what they do, what they see, and
  the rules they follow. It never talks about databases, servers or programming. The development team decides
  those things. If a technical word slips in, alterspec flags it.
- **One source of truth.** Every fact is written in exactly one place. Overviews, "who can do what" tables and
  the clickable screens are produced from it automatically, so they can never disagree with the spec.
- **The spec changes with the product.** Once the first version is agreed, every change is a proposal: what
  changes, what it affects, your approval, then it is in. Nothing changes silently.

## 2. What the spec is made of

Think of the spec as a tree. At the top is the product. Below it are its business areas. Inside each area are the
things people can do and the screens they do them on.

```text
Product (the application)
│  who uses it (personas and roles), the vocabulary (glossary), the business objects
│  (entities), shared rules, end-to-end flows, decisions, quality requirements
│
├── Module: a business area, for example Catalog or Pricing
│   ├── Capability: one thing a person can do, for example "Order an article"
│   └── Screen: what a person sees and does to do it
│       └── Experience: how that screen looks and behaves, as a working mockup
```

The building blocks, in the words you will see:

| Block | What it is | Example |
| --- | --- | --- |
| **Application** | The product itself: what it is for, which channels it runs on, one company or many, languages, currencies, time zones | A B2B catalog on the web and on mobile, in English, in euros |
| **Persona** | A kind of person who uses the product | Catalog lead, Buyer |
| **Role** | What a persona is allowed to do, and how far it reaches: their own things, their team's, their company's, everything | Catalog manager, company-wide |
| **Entity** | A business object the product keeps, with its attributes and its lifecycle | Article: name, price, supplier; draft → active → retired |
| **Module** | A business area | Catalog, Pricing, Orders |
| **Capability** | One goal a person reaches in one sitting, with who may do it, which screens, which objects it touches, and how you know it works (acceptance criteria) | "Create an article" |
| **Screen** | What a person sees: which fields of which objects, which actions, for which roles | Article record |
| **Rule** | A business rule, shared by the product or owned by one area | Article numbers are unique |
| **Flow** | How capabilities chain into an end-to-end journey | New article to sellable |
| **Event** | Something that happens in one place and matters in another | Article activated |
| **Decision** | A product decision, or an open question waiting for one | Do prices differ per customer group? |
| **Glossary term** | The one word for a thing, and the words not to use | Article (not item, not product) |

Every block has a permanent ID, such as `CAP-CAT-001` or `ENT-ARTICLE`. IDs are never renamed or reused, so a
reference from one block to another always means the same thing. You will see these IDs in Claude's answers and
in the proposals; you never have to make one up.

Every block also has a **status**: `draft → refined → ready → approved → implemented`. Working on a block can
move it as far as `refined`. Every step beyond that needs your explicit word, because it is your decision.

### What is generated for you

Some views of the spec are produced automatically and must never be edited by hand:

- the list of capabilities in each module, and which screens use which capability;
- the **role matrix**: what each role may do;
- **traceability and coverage**: does every rule, every object transition and every acceptance criterion belong
  to something, and is anything left unused;
- the **wireframe**: a clickable, plain rendering of every screen exactly as the spec describes it, with
  "Not specified" where the spec says nothing;
- the **mockup app**: the same screens as a realistic working app you can sign in to as each role, once the
  experience layer exists (section 6).

If you change the spec, these follow. You never maintain them.

## 3. How you work with it

You talk. You do not fill in forms, pick IDs or edit files.

Open Claude Code in the project and say what you mean:

```text
We need an Article with a name, a price and a supplier
Buyers should be able to order an article
What can a sales rep do with a price?
What is still missing in "Order article"?
Add gender to buyer
```

A question is answered from the spec. A wish becomes a **proposal**. Claude reads the spec as it is, drafts the
whole thing at the size of your sentence, and shows it to you before anything is written.

### The proposal

A proposal is one document you can read top to bottom in your own language. It always has the same shape:

- **The idea**, in your words.
- **What the spec already covers**, so you see what Claude found.
- **What is new and what changes**: objects, capabilities, screens, rules, flow steps, each described.
- **Not proposed, and why**: what Claude deliberately left out.
- **Open questions**: what nobody can answer but you.
- **To confirm**: every fact Claude proposed that you did not say and the spec did not contain.

The rule behind it: Claude never fills a gap with a plausible guess and moves on. Everything it had to propose is
marked `(proposed)` in the text and repeated in the "To confirm" list. You correct what is wrong, answer what you
know, as many rounds as you like, and say **go**. Only then is anything written. If a question stays unanswered,
it is recorded as an open decision attached to the object, and that object cannot advance until it is answered.

The proposal sizes itself to what you asked:

| You say | You get |
| --- | --- |
| A description of a new product | The skeleton: what the product is and its profile, personas and roles, the business areas, the first terms |
| "What is missing in the buyer entity?" | Its gaps, each with a proposed answer or an open question |
| "Add gender to buyer" | A few lines, plus every place that must change because of it |
| "Buyers should see their order history and reorder" | The full proposal: where it lives, objects, capabilities, screens, rules, flow steps |
| "Continue CHG-007" | What is still open in that change, then execution |

### The product profile

When the spec starts, you settle five things once: the channels (web, mobile, a sales desk, and whether the web
is responsive), whether the product serves one company or many, the languages, the currencies and the time zones.
Every later proposal reads this profile and never asks about it again. If the product has one currency, no
proposal will ask you about currency conversion, and the checks flag any spec content that assumes several.

### What you type yourself

Almost everything happens by talking. Four things are decisions rather than drafts, so you type them on purpose:

| Command | When |
| --- | --- |
| `/alterspec-init` plus a description of the product | Once, to start a spec from nothing |
| `npx alterspec baseline` | Once, when the first version of the spec is agreed |
| `/alterspec-apply CHG-…` and the words "approve CHG-…" | For each change you accept into the spec |
| `/alterspec-handoff MOD-…` | To hand a whole business area to the development team |

You can also ask directly for a check (`/alterspec-validate`), an impact analysis (`/alterspec-impact CHG-…`) or
the design of a screen (`/alterspec-experience`), but plain words reach the same places.

## 4. How alterspec keeps the spec right

Two kinds of checking run whenever you ask for a validation, and the result is one report.

**Deterministic checks.** Rules that are the same every time and need no judgement. They catch the things that
make a spec unreliable:

- a screen offers an action that no role on that screen may perform;
- a screen shows a field the object does not have;
- an object can move to a state that nothing in the product moves it to;
- an event is listened for but nothing sends it, or sent and nobody listens;
- a capability belongs to no flow, an object is used nowhere, a screen is reached from nowhere;
- a word is used that the glossary forbids, a technical word appears, or something assumes a language, currency
  or tenancy the profile rules out;
- a generated view is out of date or was edited by hand.

**Semantic review.** A read-only reviewer reads the spec the way a careful colleague would and reports what no
rule can see: two rules that contradict each other, data a screen needs that no capability produces, a role that
can do something it should not, an acceptance criterion nobody could test, a missing exception path. It reports
with a severity; it never edits.

Both run in the background of every proposal too, so a proposal is already clean when you read it.

## 5. Changing the spec once it is agreed

While the spec is young, every proposal you accept is written straight in. When the first version is agreed, you
run the baseline. From that moment the agreed spec is protected: nothing in it changes except through a **change
proposal**.

You do not work differently. You still say "add gender to buyer" or "we need a returns area". What differs is
where it lands: in a change, numbered `CHG-NNN`, holding only the pieces of the spec it touches, next to the
proposal document that explains it. The agreed spec stays exactly as it was until you accept the change.

A change moves through four steps:

1. **Draft.** The proposal is executed into the change. It is checked as if it were already applied, so a screen
   that shows a field before the object has it is caught at once.
2. **Impact.** Ask what the change affects. You get a business reader's list: the flows, screens, roles and
   acceptance criteria touched, the overviews that will move, the problems the change introduces or resolves, and
   the screen designs that must follow it.
3. **Review and approval.** The change goes into review. It cannot be approved while a screen design is out of
   line with it (section 6). Approval is always your explicit word, naming the change.
4. **Apply.** The change is merged into the spec, every modified object gets a new version number, the overviews
   and screens are regenerated, and the proposal is archived as the record of what was decided and why. If a
   change is rejected, the proposal stays as the record of what was considered.

Think of it as version control for product decisions. Every change in the history of the product has a number, a
reason, an impact analysis and an approval.

## 6. Seeing the product: wireframe and experience

A spec is hard to judge as text. alterspec shows it to you two ways.

**The wireframe** is produced from the spec with no design at all: every screen, with the fields and actions the
spec names, and "Not specified" wherever the spec is silent. It is always current. Open it to find what you
forgot.

**The experience** is the future app. For each screen, a designer (the UX designer agent, guided by you) turns the
wireframe into a realistic page: layout, components, labels, empty and error states, demo data. The pages form a
working mockup app: you sign in as each role, with demo people and demo data, and click through the product
before a line of it is built. Design is the one place where alterspec interviews you rather than drafting first,
because a design is confirmed by looking at it.

Two rules keep the experience honest:

- **A mockup may show nothing the spec lacks.** Every field, action and state on a page is tied to the element of
  the spec it realises, and the checks allow no deviation either way. A design may decide how a thing looks and
  what the label says; it may not add a field, an action or a rule the spec does not have.
- **A mockup follows the spec.** When a change touches a screen, its design is marked out of date and the change
  cannot be approved until the design has been brought in line and reviewed again. The experience reviewer
  produces a parity table: for each element, what the spec says, what the design says, what the page shows, and a
  verdict.

### When the design shows what the spec is missing

Designers find gaps. A page needs a "Margin" field that no object has, or a "Reject" button that no capability
performs. alterspec does not let that live only in the mockup, and it does not let it slip into the spec unseen.

Instead you ask to **lift** it. alterspec works out, for every such element, where in the spec it belongs: a
field goes to the screen and the object, an action to the screen and to a capability (an existing one, if a
likely match exists, or a new one with its place in a flow), a new role or rule to the product level. That
becomes a proposal like any other, with everything only you can decide listed to confirm: is the field required,
what kind of information is it, which capability does the button perform. You read it, answer once, say go, and
the change is executed in the spec and flows back down to the page, which keeps the design the designer already
made.

## 7. Changes travel both ways through the tree

The spec is a tree: product at the top, business areas below, capabilities and screens under them, and the
designed pages at the bottom. A change can start at any level. What alterspec guarantees is that it reaches every
other level it should, in both directions, and never silently.

### Down: from a business decision to the page

You say "buyers should see the supplier on an order". That is a business change, and it enters at the top of the
tree and flows down on its own:

1. **The object.** Order gains the attribute Supplier.
2. **The screen.** The order screen lists the new field.
3. **The capability.** "View an order" mentions it in its data and acceptance criteria, so it is tested.
4. **The generated views.** The module overview, the role matrix, coverage and the wireframe are recomputed.
5. **The experience.** The screen's design is marked out of date. The change brings the design in line: the new
   field appears on the page in an "added" block, the designer places it where it belongs, the reviewer checks
   the page against the spec again.
6. **The gate.** The change cannot be approved until every touched design is in line and reviewed. Then it is
   applied, and the capability is handed off if it is ready.

You confirm the proposal once at the start and approve the change once at the end. Everything in between is
checked, and each level is kept consistent with the one above it.

### Up: from a page to the business spec

A designer, or you, working on a mockup, adds a "Margin" field and a "Reject" button, because the page clearly
needs them. Now the bottom of the tree knows something the top does not.

alterspec notices, because the page carries an element the spec has no counterpart for, and it refuses to let the
page pass review or reach developers in that state. It also refuses to add the field and the button to the spec on
its own, because they are product decisions. Instead, **lift** computes the path up the tree for each element:

| The page needed | Where it climbs to | What only you can say |
| --- | --- | --- |
| A field that no object has | The screen, then the object | What kind of information it is, whether it is required |
| An action that nothing performs | The screen, then a capability, then a flow step | Which capability, or that it is a new one, and who may do it |
| A state or message that encodes a rule | The screen, then a rule in the area or the product | The rule itself |
| A role that does not exist | The product level | Who they are and how far their scope reaches |

Those answers become a proposal like any other. You read it, answer once, say go. The change is executed at the
business level, and then flows back **down** the tree the normal way, to the same page, which keeps the layout the
designer already made.

### Why both directions are strict

- Down is automatic because consistency is mechanical: if the spec says a field exists, every view and every page
  must show it, and the checks can prove that they do.
- Up is never automatic because content is a decision: a page can show that something is needed, but not what it
  means for the product. That is yours to say, once.

## 8. Handing off to the development team

When a capability is ready, alterspec packages it as a self-contained **bundle**: the spec it needs (the
capability, its screens, objects, rules, flows and acceptance criteria), the wireframe and the designed
experience of its screens, and a manifest of the exact versions. The development team gets everything they need
to plan and build, and nothing about how to build it.

There is a gate. A capability is handed off only when it is `ready`, has no outstanding problems, and every one of
its screens has a design that is complete, reviewed and clean. There is no way around the gate. Applying a change
hands off every capability it touched that passes, refreshes bundles whose contents moved, and tells you what was
held back and why. Handing off a whole business area is something you ask for by name.

## 9. The lifecycle at a glance

```text
 start ──► talk ──► look ──► baseline ──► change ──► impact ──► approve ──► apply ──► handoff
```

1. **Start.** Describe the product once. Confirm the skeleton. Settle the profile.
2. **Talk.** Every sentence about the product is a proposal: drafted, marked, confirmed, written.
3. **Look.** Ask for a check. Open the wireframe. Design the screens and click through the mockup app.
4. **Baseline.** Freeze the agreed first version.
5. **Change.** The same sentences, now as numbered change proposals.
6. **Impact, approve, apply.** See what a change touches, say the word, and it is in with a record.
7. **Handoff.** Ready capabilities reach the development team as bundles, automatically on apply.

## 10. What alterspec never does

- It never invents a business fact. What it had to propose is marked and listed for you to confirm.
- It never changes the agreed spec without a numbered change and your approval by name.
- It never lets a mockup carry something the spec does not say, or ship a screen whose design is unreviewed.
- It never moves an object to `ready` or beyond on its own.
- It never puts technology into the spec, and never decides how the product is built.
