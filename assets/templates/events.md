# Business events

<!--
Things that happen in the business that other parts of the product (or external parties) react to.
Who emits and who consumes is declared in capability front-matter (`events.emits` / `events.consumes`).
Set `external: true` when the event comes from or goes to a party outside the product.
Each item is a `## <ID> <Title>` heading followed by a yaml block, then prose.
-->

## EVT-{{event}} {{title}}

```yaml
id: EVT-{{event}}
title: "{{title}}"
external: {{external}}
entities: []
```

<!-- When it happens, and who needs to know (including notifications to people). -->
