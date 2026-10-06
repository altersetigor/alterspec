<!-- GENERATED:file hash=c454aa6ade7a — written by `alterspec views`; do not edit -->

# Traceability

Flow → step → capability → screens, rules and acceptance criteria.

## [FLOW-001](../application/flows/FLOW-001.md) New article to sellable

| Step | Capability | Role | Screens | Rules | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| 1 | [CAP-CAT-004](../modules/cat/capabilities/CAP-CAT-004.md) Create article | ROLE-CATALOG-MANAGER | SCR-CAT-01 | RULE-CAT-001 | CAP-CAT-004-AC-01, CAP-CAT-004-AC-02 |
| 2 | [CAP-CAT-005](../modules/cat/capabilities/CAP-CAT-005.md) Activate article | ROLE-CATALOG-MANAGER | SCR-CAT-01 | RULE-CAT-002 | CAP-CAT-005-AC-01, CAP-CAT-005-AC-02 |
| 3 | [CAP-SUP-004](../modules/sup/capabilities/CAP-SUP-004.md) Record purchase price | ROLE-PURCHASER | SCR-SUP-02 | RULE-SUP-001 | CAP-SUP-004-AC-01, CAP-SUP-004-AC-02 |
| 4 | [CAP-PRC-001](../modules/prc/capabilities/CAP-PRC-001.md) Propose sales price | ROLE-PRICING-MANAGER | SCR-PRC-01 | RULE-001, RULE-PRC-001 | CAP-PRC-001-AC-01, CAP-PRC-001-AC-02, CAP-PRC-001-AC-03 |
| 5 | [CAP-PRC-002](../modules/prc/capabilities/CAP-PRC-002.md) Approve sales price | ROLE-PRICING-MANAGER | SCR-PRC-01 | RULE-001, RULE-PRC-001, RULE-PRC-002 | CAP-PRC-002-AC-01, CAP-PRC-002-AC-02, CAP-PRC-002-AC-03 |
| 6 | [CAP-GLB-001](../modules/glb/capabilities/CAP-GLB-001.md) Look up article prices | ROLE-SALES-STAFF | SCR-GLB-01 | RULE-001 | CAP-GLB-001-AC-01 |

## [FLOW-002](../application/flows/FLOW-002.md) Supplier price update

| Step | Capability | Role | Screens | Rules | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| 1 | [CAP-SUP-005](../modules/sup/capabilities/CAP-SUP-005.md) Import supplier price list | ROLE-PURCHASER | SCR-SUP-02 | RULE-SUP-001 | CAP-SUP-005-AC-01, CAP-SUP-005-AC-02 |
| 2 | [CAP-SUP-006](../modules/sup/capabilities/CAP-SUP-006.md) Approve purchase price | ROLE-PURCHASER | SCR-SUP-02 | RULE-SUP-001 | CAP-SUP-006-AC-01 |
| 3 | [CAP-PRC-001](../modules/prc/capabilities/CAP-PRC-001.md) Propose sales price | ROLE-PRICING-MANAGER | SCR-PRC-01 | RULE-001, RULE-PRC-001 | CAP-PRC-001-AC-01, CAP-PRC-001-AC-02, CAP-PRC-001-AC-03 |
| 4 | [CAP-PRC-002](../modules/prc/capabilities/CAP-PRC-002.md) Approve sales price | ROLE-PRICING-MANAGER | SCR-PRC-01 | RULE-001, RULE-PRC-001, RULE-PRC-002 | CAP-PRC-002-AC-01, CAP-PRC-002-AC-02, CAP-PRC-002-AC-03 |

## [FLOW-003](../application/flows/FLOW-003.md) Prepare catalog master data

| Step | Capability | Role | Screens | Rules | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| 1 | [CAP-CAT-003](../modules/cat/capabilities/CAP-CAT-003.md) Maintain units of measure | ROLE-CATALOG-MANAGER | SCR-CAT-02 | — | CAP-CAT-003-AC-01, CAP-CAT-003-AC-02 |
| 2 | [CAP-CAT-001](../modules/cat/capabilities/CAP-CAT-001.md) Maintain brands | ROLE-CATALOG-MANAGER | SCR-CAT-02 | — | CAP-CAT-001-AC-01, CAP-CAT-001-AC-02 |
| 3 | [CAP-CAT-002](../modules/cat/capabilities/CAP-CAT-002.md) Maintain categories | ROLE-CATALOG-MANAGER | SCR-CAT-02 | — | CAP-CAT-002-AC-01, CAP-CAT-002-AC-02 |

## [FLOW-004](../application/flows/FLOW-004.md) Discontinue article

| Step | Capability | Role | Screens | Rules | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| 1 | [CAP-CAT-006](../modules/cat/capabilities/CAP-CAT-006.md) Discontinue article | ROLE-CATALOG-MANAGER | SCR-CAT-01 | — | CAP-CAT-006-AC-01 |
| 2 | [CAP-PRC-003](../modules/prc/capabilities/CAP-PRC-003.md) Expire sales prices of a discontinued article | ROLE-PRICING-MANAGER | SCR-PRC-01 | RULE-001 | CAP-PRC-003-AC-01 |

## [FLOW-005](../application/flows/FLOW-005.md) Supplier lifecycle

| Step | Capability | Role | Screens | Rules | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| 1 | [CAP-SUP-001](../modules/sup/capabilities/CAP-SUP-001.md) Register supplier | ROLE-PURCHASER | SCR-SUP-01 | — | CAP-SUP-001-AC-01 |
| 2 | [CAP-SUP-002](../modules/sup/capabilities/CAP-SUP-002.md) Approve supplier | ROLE-PURCHASER | SCR-SUP-01 | — | CAP-SUP-002-AC-01 |
| 3 | [CAP-SUP-003](../modules/sup/capabilities/CAP-SUP-003.md) Block supplier | ROLE-PURCHASER | SCR-SUP-01 | — | CAP-SUP-003-AC-01 |

## Capabilities without a flow

_None._
