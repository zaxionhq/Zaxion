# Audit & Compliance Ledger

## 1. The Decision Ledger
Every PR analysis is recorded as a **Decision**. This includes:
*   The exact `commit_sha`.
*   The `policy_version` used for the evaluation.
*   The raw code facts (AST data).
*   The rationale for the PASS/BLOCK.

## 2. Governance Signals
Beyond simple decisions, Zaxion records **Signals**:
*   **Bypass Velocity:** Alerts when overrides are happening too frequently.
*   **Policy Drift:** Tracks how many PRs would fail if a new policy version were applied today.
*   **Audit Trail:** A complete, unchangeable history of who merged what and why.

## 3. Exporting Data
All governance data is available via REST API for integration with external security dashboards and compliance tools.
