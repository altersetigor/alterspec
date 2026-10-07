# /alterspec-prototype — design and design-system variants of the prototype

Read `.alterspec/prompts/_shared.md` first and follow it.

Arguments: a variant (`bootstrap`, `tabler`, `tailwind`, `custom`), `check`, or `design` (change the design). Without
arguments: build the variant named in `design/design.yaml`, or start the design interview when there is none.

## What exists

- `spec/_generated/prototype/` is the **generic prototype**: plain pages generated from the spec by
  `alterspec views`. It is part of the generated views, so never edit it; it changes when the spec changes.
- `design/` is the person's **design layer**: `design.yaml` (base design system, app name, logo, layout, theme) and
  `tokens.css` (their own CSS). It is not part of the spec, so the no-technology rule doesn't apply here; still,
  never copy design details into the spec.
- `prototype/<variant>/` holds **variants**: the same pages rendered with a design system. Every business element
  carries a `data-src` marker with its spec ID, and `alterspec prototype check` compares the markers with the spec.

The spec stays the source of truth. If the person wants something on a page to change (a field, an action, a text),
that is a spec change: use the `change-*` commands, never edit the pages.

## 1. Design (when `design/design.yaml` is missing, or the argument is `design`)

1. Run `alterspec prototype init --base <base> --json` once the person has picked a base. It never overwrites.
2. Interview, at most 3 questions at a time:
   - the base: `bootstrap` (safe default), `tabler` (admin look), `tailwind` (shadcn/ui-style tokens) or `custom`
     (their own design system, from component examples)
   - brand: application name in the header, logo file (copy it into `design/assets/`), primary colour; optionally
     secondary, success, danger and warning colours, font, corner radius, dark mode
   - layout: navigation in a `sidebar` or along the `topbar`
   - what they can share from the real application: its CSS variables (put them in `design/tokens.css`), a design
     token export, or screenshots. From screenshots, propose colours, font and radius and let the person confirm them;
     never present a guess as their brand.
3. Write `design/design.yaml` (colours as `#rrggbb`, radius as `6px` or `0.5rem`) and `design/tokens.css`.

## 2. Build

- For `bootstrap`, `tabler` or `tailwind`: run `alterspec views`, then
  `alterspec prototype build --variant <variant> --json`. The build is deterministic; don't edit its output.
- For `custom`:
  1. Read `design/components/` (HTML examples of the person's components) and `design/references/` (screenshots).
     If neither exists, ask for them.
  2. Start from the pages of a built variant or the generic prototype and restyle them into `prototype/custom/`
     with the person's markup and CSS.
  3. Keep every element that has a `data-src` attribute, with the same value, and add none. Keep `id="as-role"`,
     the `data-roles`, `data-state-set`, `data-action` and `data-for` attributes, the `as-*` classes, `state.css`
     and `app.js`: they make roles and business states work.
  4. When the spec changes later, update the affected pages the same way; `impact` and `prototype check` say which.

## 3. Check (always, and for the `check` argument)

Run `alterspec prototype check --json` (add `--variant <v>` for one). Findings:

- `missing-page`, `missing-element`: something from the spec is not on the page; build again, or add it back to a
  custom page.
- `extra-page`, `extra-element`: the page shows something the spec doesn't have; remove it, or, if the person wants
  it, add it to the spec first.
- `stale`: the spec changed after the variant was built; build again. For a custom variant, update the pages, check
  again, then record it with `alterspec prototype check --variant custom --stamp`.
- `unstamped`: a custom variant that was never stamped; stamp it once it passes.

Finish by telling the person which folder to open (`prototype/<variant>/index.html`), that the role picker and the
state buttons show what each role sees and the empty, no-permission and error states, and that the yellow notes are
gaps in the spec they can close with `/alterspec-refine` or the `change-*` commands.
