/* global window */
// Written by `alterspec views` from the spec. Do not edit: it is rewritten.
window.UX_SPEC = {
  "app": "Fixture People",
  "roles": {
    "ROLE-ACCOUNTANT": "Accountant",
    "ROLE-EMPLOYEE": "Employee",
    "ROLE-HR-MANAGER": "HR manager"
  },
  "modules": [
    {
      "id": "MOD-GLB",
      "title": "Shared"
    },
    {
      "id": "MOD-HR",
      "title": "Employee records"
    },
    {
      "id": "MOD-PAY",
      "title": "Payslips"
    }
  ],
  "screens": {
    "SCR-GLB-01": {
      "title": "My payslips",
      "module": "MOD-GLB",
      "roles": [
        "ROLE-EMPLOYEE"
      ],
      "top": true,
      "parents": [],
      "record": false,
      "scopes": {
        "ROLE-EMPLOYEE": "own"
      }
    },
    "SCR-HR-01": {
      "title": "Employee record",
      "module": "MOD-HR",
      "roles": [
        "ROLE-HR-MANAGER"
      ],
      "top": true,
      "parents": [],
      "record": false,
      "scopes": {
        "ROLE-HR-MANAGER": "org"
      }
    },
    "SCR-PAY-01": {
      "title": "Payslip run",
      "module": "MOD-PAY",
      "roles": [
        "ROLE-ACCOUNTANT"
      ],
      "top": true,
      "parents": [],
      "record": false,
      "scopes": {
        "ROLE-ACCOUNTANT": "org"
      }
    }
  },
  "entities": {
    "ENT-EMPLOYEE": {
      "title": "Employee",
      "prefix": "employee",
      "label": "Full name",
      "initialState": "draft",
      "states": [
        "draft",
        "active",
        "left"
      ],
      "attributes": {
        "Full name": {
          "kind": "text",
          "required": true
        },
        "Start date": {
          "kind": "date",
          "required": true
        },
        "Contract type": {
          "kind": "choice",
          "required": false,
          "options": [
            "Permanent",
            "Fixed term"
          ]
        }
      }
    },
    "ENT-PAYSLIP": {
      "title": "Payslip",
      "prefix": "payslip",
      "initialState": "draft",
      "states": [
        "draft",
        "issued"
      ],
      "attributes": {
        "Employee": {
          "kind": "reference",
          "required": true,
          "references": "ENT-EMPLOYEE"
        },
        "Period": {
          "kind": "period",
          "required": true
        },
        "Net amount": {
          "kind": "amount",
          "required": true
        }
      }
    }
  },
  "tones": {
    "active": "success",
    "draft": "info",
    "issued": "success",
    "left": "muted"
  }
};
