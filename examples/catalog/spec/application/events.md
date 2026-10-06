# Business events

<!--
Who emits and who consumes is declared in capability front-matter (`events.emits` / `events.consumes`).
-->

## EVT-ARTICLE-ACTIVATED Article activated

```yaml
id: EVT-ARTICLE-ACTIVATED
title: "Article activated"
external: false
entities: [ENT-ARTICLE]
```

An article became active. Pricing is told so a sales price can be proposed.

## EVT-ARTICLE-DISCONTINUED Article discontinued

```yaml
id: EVT-ARTICLE-DISCONTINUED
title: "Article discontinued"
external: false
entities: [ENT-ARTICLE]
```

An article will no longer be sold. Its valid sales prices must expire.

## EVT-SUPPLIER-PRICE-LIST-RECEIVED Supplier price list received

```yaml
id: EVT-SUPPLIER-PRICE-LIST-RECEIVED
title: "Supplier price list received"
external: true
entities: [ENT-SUPPLIER, ENT-PURCHASE-PRICE]
```

A supplier sends new purchase prices for some of its articles.

## EVT-PURCHASE-PRICE-CHANGED Purchase price changed

```yaml
id: EVT-PURCHASE-PRICE-CHANGED
title: "Purchase price changed"
external: false
entities: [ENT-PURCHASE-PRICE]
```

A new purchase price became valid. Pricing checks whether the sales price still covers it.
