# Business rules (application-wide)

<!--
Rules shared by more than one module live here as RULE-NNN.
Rules owned by one module live in modules/<mod>/rules.md as RULE-<MOD>-NNN.
-->

## RULE-001 Only active articles are sold

```yaml
id: RULE-001
title: "Only active articles are sold"
status: refined
entities: [ENT-ARTICLE, ENT-SALES-PRICE]
```

An article can have a valid sales price, and be shown to sales staff, only while it is active.
