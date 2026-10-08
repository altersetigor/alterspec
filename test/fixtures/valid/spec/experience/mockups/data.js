/* global window */
// Demo data the mockups start from (and return to on "Reset demo data"). Make it realistic: real names,
// prices, descriptions and image URLs. Keep ids stable; references point to ids. Bump `version` after editing.
window.UX_DATA = {
  "version": "7a2392c04099",
  "entities": {
    "ENT-EMPLOYEE": [
      {
        "id": "employee-1",
        "entity": "ENT-EMPLOYEE",
        "state": "draft",
        "owner": "u1",
        "values": {
          "Full name": "Emma Clarke",
          "Start date": "2026-06-23",
          "Contract type": "Permanent"
        }
      },
      {
        "id": "employee-2",
        "entity": "ENT-EMPLOYEE",
        "state": "active",
        "owner": "u2",
        "values": {
          "Full name": "James Walker",
          "Start date": "2026-06-22",
          "Contract type": "Fixed term"
        }
      },
      {
        "id": "employee-3",
        "entity": "ENT-EMPLOYEE",
        "state": "left",
        "owner": "u3",
        "values": {
          "Full name": "Olivia Bennett",
          "Start date": "2026-06-17",
          "Contract type": "Permanent"
        }
      },
      {
        "id": "employee-4",
        "entity": "ENT-EMPLOYEE",
        "state": "draft",
        "owner": "u1",
        "values": {
          "Full name": "Liam Turner",
          "Start date": "2026-06-08",
          "Contract type": "Fixed term"
        }
      },
      {
        "id": "employee-5",
        "entity": "ENT-EMPLOYEE",
        "state": "active",
        "owner": "u2",
        "values": {
          "Full name": "Sophie Hughes",
          "Start date": "2026-06-03",
          "Contract type": "Permanent"
        }
      },
      {
        "id": "employee-6",
        "entity": "ENT-EMPLOYEE",
        "state": "left",
        "owner": "u3",
        "values": {
          "Full name": "Noah Mitchell",
          "Start date": "2026-06-02",
          "Contract type": "Fixed term"
        }
      },
      {
        "id": "employee-7",
        "entity": "ENT-EMPLOYEE",
        "state": "draft",
        "owner": "u1",
        "values": {
          "Full name": "Grace Parker",
          "Start date": "2026-05-28",
          "Contract type": "Permanent"
        }
      },
      {
        "id": "employee-8",
        "entity": "ENT-EMPLOYEE",
        "state": "active",
        "owner": "u2",
        "values": {
          "Full name": "Oliver Reed",
          "Start date": "2026-05-28",
          "Contract type": "Fixed term"
        }
      }
    ],
    "ENT-PAYSLIP": [
      {
        "id": "payslip-1",
        "entity": "ENT-PAYSLIP",
        "state": "draft",
        "owner": "u1",
        "values": {
          "Employee": "employee-4",
          "Period": "2026-07",
          "Net amount": 35.99
        }
      },
      {
        "id": "payslip-2",
        "entity": "ENT-PAYSLIP",
        "state": "issued",
        "owner": "u2",
        "values": {
          "Employee": "employee-3",
          "Period": "2026-08",
          "Net amount": 454.99
        }
      },
      {
        "id": "payslip-3",
        "entity": "ENT-PAYSLIP",
        "state": "draft",
        "owner": "u3",
        "values": {
          "Employee": "employee-5",
          "Period": "2026-09",
          "Net amount": 273.99
        }
      },
      {
        "id": "payslip-4",
        "entity": "ENT-PAYSLIP",
        "state": "issued",
        "owner": "u1",
        "values": {
          "Employee": "employee-5",
          "Period": "2026-10",
          "Net amount": 340.99
        }
      },
      {
        "id": "payslip-5",
        "entity": "ENT-PAYSLIP",
        "state": "draft",
        "owner": "u2",
        "values": {
          "Employee": "employee-7",
          "Period": "2026-11",
          "Net amount": 159.99
        }
      },
      {
        "id": "payslip-6",
        "entity": "ENT-PAYSLIP",
        "state": "issued",
        "owner": "u3",
        "values": {
          "Employee": "employee-1",
          "Period": "2026-12",
          "Net amount": 578.99
        }
      },
      {
        "id": "payslip-7",
        "entity": "ENT-PAYSLIP",
        "state": "draft",
        "owner": "u1",
        "values": {
          "Employee": "employee-8",
          "Period": "2026-01",
          "Net amount": 397.99
        }
      },
      {
        "id": "payslip-8",
        "entity": "ENT-PAYSLIP",
        "state": "issued",
        "owner": "u2",
        "values": {
          "Employee": "employee-3",
          "Period": "2026-02",
          "Net amount": 568.99
        }
      }
    ]
  }
};
