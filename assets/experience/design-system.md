# Design system

<!--
How the application looks. The starter below is alterspec's neutral design system. To use your own, replace
mockups/kit/tokens.css and mockups/kit/components.css (or add your stylesheet next to them), and keep the component
names in the yaml block in step with what your mockups use; the checks read that block.
-->

## Foundations

- **Colour:** neutral greys, one primary colour for main actions and links, semantic colours for success, warning
  and danger. Defined as CSS variables in `mockups/kit/tokens.css`.
- **Typography:** the system font stack; 14px body, 24px page titles, 16px section titles.
- **Spacing and shape:** a 4px grid; 8px corner radius on cards, 6px on controls.
- **Icons:** none in the starter; use text labels. If you add icons, every icon-only control needs an accessible
  label.

## Components

```yaml
components:
  page-title: Page heading, one per screen
  breadcrumb: Path to the current screen
  button-primary: The main action of a region
  button-secondary: Other actions
  button-danger: Destructive actions, always confirmed
  data-table: Rows of records with columns
  table-column: A column of a data table
  detail-list: Label and value pairs for one record
  value: A read-only value
  badge: A short status
  card: A bordered container
  section: A titled part of a form or page
  field-text: Single-line text input
  field-number: Number input
  field-amount: Money input with currency
  field-date: Date input
  field-period: Month or period input
  field-select: Choose one option
  field-checkbox: Yes or no
  field-reference: Choose another record
  field-document: Attach a document
  empty-state: Message when there is nothing to show
  permission-state: Message when the person may not see the screen
  validation-summary: Summary of what to fix before saving
  error-state: Message when loading or saving failed
  metric: A number with its label
  tabs: Switch between parts of a page
  dialog: A window on top of the page
  toast: A short confirmation after an action
```

## Images

Demo photos come from the image URL template in `mockups/config.js` (by default Picsum: real photos with random
subjects) until they are replaced by photos that match each record. Note here where the photos come from and under
which licence, so nobody mistakes them for the product's own content.

## Responsive behaviour

- At 1024px and wider: navigation on the left, side regions beside the main content.
- Below 1024px: navigation collapses into a menu; side regions move under the main content; tables scroll
  horizontally.

## Accessibility

- Contrast at least 4.5:1 for text.
- Every field has a visible label; required fields are marked and announced.
- Focus is always visible; after an action, focus moves to its result (a dialog, a message, the changed row).
