# Business events

## EVT-EMPLOYEE-HIRED Employee hired

```yaml
id: EVT-EMPLOYEE-HIRED
title: Employee hired
external: false
entities: [ENT-EMPLOYEE]
```

Happens when an employee becomes active.

## EVT-BANK-PAYMENT-CONFIRMED Bank payment confirmed

```yaml
id: EVT-BANK-PAYMENT-CONFIRMED
title: Bank payment confirmed
external: true
entities: [ENT-PAYSLIP]
```

The bank confirms that the pay was transferred.
