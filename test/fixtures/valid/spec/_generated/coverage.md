<!-- GENERATED:file hash=68aec81a558e — written by `alterspec views`; do not edit -->

# Coverage

## Entity lifecycle

| Entity | C | R | U | D | A | Missing | Uncovered transitions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ENT-EMPLOYEE](../application/entities/ENT-EMPLOYEE.md) | ✓ | ✓ | ✓ |  | ✓ | — | — |
| [ENT-PAYSLIP](../application/entities/ENT-PAYSLIP.md) | ✓ | ✓ | ✓ |  | ✓ | — | — |

## Events

| Event | Emitted by | Consumed by | External |
| --- | --- | --- | --- |
| EVT-BANK-PAYMENT-CONFIRMED | — | CAP-PAY-002 | yes |
| EVT-EMPLOYEE-HIRED | CAP-HR-002 | CAP-PAY-001 | no |
