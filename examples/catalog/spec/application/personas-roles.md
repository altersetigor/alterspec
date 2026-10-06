# Personas and roles

<!--
Three separate concepts:
- Persona (PER-*): who the person is, their goals and pain points. Narrative.
- Role (ROLE-*): an access-bearing identity. Capabilities grant roles a permission scope.
- Permission scope: own | team | org | all — set per capability in its front-matter.
-->

# Personas

## PER-CATALOG-LEAD Catalog lead

```yaml
id: PER-CATALOG-LEAD
title: "Catalog lead"
roles: [ROLE-CATALOG-MANAGER]
```

**Goals:** a complete, consistent catalog; no article on sale before it is ready.

**Pain points:** articles created in a hurry with missing data; duplicate brands and categories.

## PER-BUYER Buyer

```yaml
id: PER-BUYER
title: "Buyer"
roles: [ROLE-PURCHASER]
```

**Goals:** work only with approved suppliers; keep purchase prices current.

**Pain points:** supplier price lists arrive by email and have to be typed in by hand.

## PER-PRICING-ANALYST Pricing analyst

```yaml
id: PER-PRICING-ANALYST
title: "Pricing analyst"
roles: [ROLE-PRICING-MANAGER]
```

**Goals:** sales prices that cover the purchase price and are approved before anyone uses them.

**Pain points:** learns about purchase price increases weeks later.

## PER-SALES-REP Sales representative

```yaml
id: PER-SALES-REP
title: "Sales representative"
roles: [ROLE-SALES-STAFF]
```

**Goals:** quote the right price for the right article, fast.

**Pain points:** never sure whether the price in front of them is still valid.

# Roles

## ROLE-CATALOG-MANAGER Catalog manager

```yaml
id: ROLE-CATALOG-MANAGER
title: "Catalog manager"
```

Maintains articles and catalog master data (brands, categories, units of measure).

## ROLE-PURCHASER Purchaser

```yaml
id: ROLE-PURCHASER
title: "Purchaser"
```

Manages suppliers and the purchase prices they offer.

## ROLE-PRICING-MANAGER Pricing manager

```yaml
id: ROLE-PRICING-MANAGER
title: "Pricing manager"
```

Proposes and approves sales prices.

## ROLE-SALES-STAFF Sales staff

```yaml
id: ROLE-SALES-STAFF
title: "Sales staff"
```

Looks up active articles and their valid sales prices. Changes nothing.
