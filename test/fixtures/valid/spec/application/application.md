---
id: APP
title: Fixture People
status: draft
version: 1
channels:
  - name: Backoffice
    kind: backoffice
    audience: HR and finance staff
  - name: Employee portal
    kind: web
    audience: Employees
    responsive: true
profile:
  tenancy: single
  languages: [en]
  currencies: [EUR]
  time_zones: single
modules:
  - MOD-GLB
  - MOD-HR
  - MOD-PAY
---

# Fixture People

## Vision

A small people-management product used as the alterspec test fixture.

## Problems solved

- HR managers register new employees and record when they leave.
- Accountants prepare and issue a payslip for every active employee.
- Employees see their own payslips.

## Modules

- MOD-GLB — shared screens
- MOD-HR — employee records
- MOD-PAY — payslips
