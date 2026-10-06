# Business rules — MOD-SUP

<!--
Rules owned by this module, as RULE-SUP-NNN. Rules shared across modules belong in application/rules.md.
-->

## RULE-SUP-001 Purchase prices come from approved suppliers

```yaml
id: RULE-SUP-001
title: "Purchase prices come from approved suppliers"
status: refined
entities: [ENT-SUPPLIER, ENT-PURCHASE-PRICE]
```

A purchase price can only be recorded or approved for a supplier that is approved.
