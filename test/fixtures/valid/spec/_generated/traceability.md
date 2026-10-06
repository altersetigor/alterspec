<!-- GENERATED:file hash=ebcac0211a4f — written by `alterspec views`; do not edit -->

# Traceability

Flow → step → capability → screens, rules and acceptance criteria.

## [FLOW-001](../application/flows/FLOW-001.md) Hire to first payslip

| Step | Capability | Role | Screens | Rules | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| 1 | [CAP-HR-001](../modules/hr/capabilities/CAP-HR-001.md) Register employee | ROLE-HR-MANAGER | SCR-HR-01 | RULE-HR-001 | CAP-HR-001-AC-01 |
| 2 | [CAP-HR-002](../modules/hr/capabilities/CAP-HR-002.md) Activate employee | ROLE-HR-MANAGER | SCR-HR-01 | — | CAP-HR-002-AC-01 |
| 3 | [CAP-PAY-001](../modules/pay/capabilities/CAP-PAY-001.md) Prepare payslip | ROLE-ACCOUNTANT | SCR-PAY-01 | RULE-001 | CAP-PAY-001-AC-01 |
| 4 | [CAP-PAY-002](../modules/pay/capabilities/CAP-PAY-002.md) Issue payslip | ROLE-ACCOUNTANT | SCR-PAY-01 | RULE-001 | CAP-PAY-002-AC-01 |
| 5 | [CAP-GLB-001](../modules/glb/capabilities/CAP-GLB-001.md) View my payslips | ROLE-EMPLOYEE | SCR-GLB-01 | — | CAP-GLB-001-AC-01 |

## [FLOW-002](../application/flows/FLOW-002.md) Employee leaves

| Step | Capability | Role | Screens | Rules | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| 1 | [CAP-HR-003](../modules/hr/capabilities/CAP-HR-003.md) Record employee leaving | ROLE-HR-MANAGER | SCR-HR-01 | — | CAP-HR-003-AC-01 |

## Capabilities without a flow

_None._
