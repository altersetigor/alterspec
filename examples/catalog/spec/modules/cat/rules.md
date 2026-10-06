# Business rules — MOD-CAT

<!--
Rules owned by this module, as RULE-CAT-NNN. Rules shared across modules belong in application/rules.md.
-->

## RULE-CAT-001 Article numbers are unique

```yaml
id: RULE-CAT-001
title: "Article numbers are unique"
status: refined
entities: [ENT-ARTICLE]
```

An article number is used by one article only, and is never reused after an article is discontinued.

## RULE-CAT-002 Only complete articles are activated

```yaml
id: RULE-CAT-002
title: "Only complete articles are activated"
status: refined
entities: [ENT-ARTICLE]
```

An article can only become active when it has a name, a category and a unit of measure that are not archived.
