# Business rules (application-wide)

## RULE-001 Only active employees are paid

```yaml
id: RULE-001
title: Only active employees are paid
status: draft
entities: [ENT-EMPLOYEE, ENT-PAYSLIP]
```

A payslip may only be prepared for an employee who is active.
