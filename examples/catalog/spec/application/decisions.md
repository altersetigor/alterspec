# Decisions, open questions and assumptions

<!--
A running log. IDs are never reused. A decision that changes an earlier one supersedes it.
-->

## DEC-001 Do sales prices differ per customer group?

```yaml
id: DEC-001
title: "Do sales prices differ per customer group?"
kind: open_question
status: open
affects: [ENT-SALES-PRICE]
```

**Context:** Some customers get better prices today, agreed outside any system. Until this is decided, an article
has one valid sales price at a time.

## DEC-002 One currency

```yaml
id: DEC-002
title: "One currency"
kind: decision
status: decided
date: 2026-10-01
affects: [ENT-PURCHASE-PRICE, ENT-SALES-PRICE]
```

**Context:** All suppliers and customers are domestic.

**Decision:** All prices are in one currency. Supplier price lists in another currency are rejected.
