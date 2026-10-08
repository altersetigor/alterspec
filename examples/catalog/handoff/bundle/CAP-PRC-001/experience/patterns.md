# Patterns

<!--
How screens are put together. Experience screens pick an archetype and place every element in one of its regions.
Change the archetypes and regions to match your application; keep the yaml block, the checks read it.
-->

## Archetypes

```yaml
archetypes:
  list:
    description: Find and act on many records
    regions: [header, toolbar, filters, results, detail, messages]
  detail:
    description: One record, what it is and what can be done with it
    regions: [header, summary, main, side, actions, messages]
  editor:
    description: Enter or change one record
    regions: [header, form, side, actions, messages]
  dashboard:
    description: Overview of several things at once
    regions: [header, metrics, main, side, messages]
  dialog:
    description: A short task on top of another screen
    regions: [title, body, actions, messages]
```

- **list:** header with title and the main action; toolbar with search; optional filter panel; results table; a
  detail panel opens beside the results.
- **detail:** header with title, status badge and actions; summary card with the key facts; main content in sections
  or tabs; side column for related information.
- **editor:** header with title; the form in sections, required fields marked; actions at the bottom (primary on the
  right); side column for help or a preview.
- **dashboard:** header; a row of metrics; main and side content.
- **dialog:** title, body, and actions at the bottom.

## States

- **Loading:** skeleton rows or cards in place of the content, never a blank screen.
- **Empty:** an empty-state card in place of the data, with one sentence and the action that fills it.
- **No permission:** a permission-state card in place of the whole content; navigation stays.
- **Validation:** a validation summary above the form and a message under each field in error.
- **Errors:** an error-state card with what failed and a Retry button.

## Microcopy

- Buttons say what they do: a verb and, if needed, the object ("Approve", "Add supplier").
- Use the glossary's canonical terms in every label and message.
- Confirm destructive actions in a dialog that repeats the action name on its button.
