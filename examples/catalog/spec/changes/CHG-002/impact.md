# Impact of CHG-002 — Article replacement on discontinuation

Status: in_review. 0 error(s) in the spec after this change. 0 conflict(s).

## Conflicts

_None._

## Added

_None._

## Modified

- CAP-CAT-006 — Discontinue article (sections: Main flow, Acceptance criteria)
- ENT-ARTICLE — Article (fields: attributes, relationships)

## Removed

_None._

## Affected objects

- CAP-CAT-004 references ENT-ARTICLE (entities.0)
- CAP-CAT-005 references ENT-ARTICLE (entities.0)
- CAP-GLB-001 references ENT-ARTICLE (entities.0)
- CAP-PRC-001 references ENT-ARTICLE (entities.1)
- CAP-SUP-004 references ENT-ARTICLE (entities.1)
- CAP-SUP-005 references ENT-ARTICLE (entities.2)
- ENT-PURCHASE-PRICE references ENT-ARTICLE (relationships.0)
- ENT-SALES-PRICE references ENT-ARTICLE (relationships.0)
- EVT-ARTICLE-ACTIVATED references ENT-ARTICLE (entities.0)
- EVT-ARTICLE-DISCONTINUED references ENT-ARTICLE (entities.0)
- FLOW-004 references CAP-CAT-006 (steps.0.capability)
- RULE-001 references ENT-ARTICLE (entities.0)
- RULE-CAT-001 references ENT-ARTICLE (entities.0)
- RULE-CAT-002 references ENT-ARTICLE (entities.0)
- SCR-CAT-01 references CAP-CAT-006 (actions.2)

## Affected flows

- FLOW-004

## Affected acceptance criteria

- CAP-CAT-006-AC-01
- CAP-CAT-006-AC-02

## Generated views that change

- _generated/index.json
- _generated/traceability.md

## New findings

_None._

## Findings this change resolves

_None._
