# Business rules — MOD-PRC

<!--
Rules owned by this module, as RULE-PRC-NNN. Rules shared across modules belong in application/rules.md.
-->

## RULE-PRC-001 Sales price covers the purchase price

```yaml
id: RULE-PRC-001
title: "Sales price covers the purchase price"
status: refined
entities: [ENT-SALES-PRICE, ENT-PURCHASE-PRICE]
```

A sales price must be higher than the highest valid purchase price of the same article.

## RULE-PRC-002 Sales prices keep a minimum margin

```yaml
id: RULE-PRC-002
title: "Sales prices keep a minimum margin"
status: refined
entities: [ENT-SALES-PRICE, ENT-PURCHASE-PRICE]
```

A sales price must be at least 10 percent higher than the highest valid purchase price of the same article.
