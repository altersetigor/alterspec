# Impact of CHG-001 — Minimum margin on sales prices

Status: draft. 0 error(s) in the spec after this change. 0 conflict(s).

## Conflicts

_None._

## Added

- RULE-PRC-002 — Sales prices keep a minimum margin

## Modified

- CAP-PRC-002 — Approve sales price (fields: rules) (sections: Alternative and exception flows, Business rules applied, Acceptance criteria)

## Removed

_None._

## Affected objects

- FLOW-001 references CAP-PRC-002 (steps.4.capability)
- FLOW-002 references CAP-PRC-002 (steps.3.capability)
- SCR-PRC-01 references CAP-PRC-002 (actions.1)

## Affected flows

- FLOW-001
- FLOW-002

## Affected acceptance criteria

- CAP-PRC-002-AC-01
- CAP-PRC-002-AC-02
- CAP-PRC-002-AC-03

## Generated views that change

- _generated/index.json
- _generated/traceability.md

## New findings

_None._

## Findings this change resolves

_None._
