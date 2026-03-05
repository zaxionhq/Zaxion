# Phase 7: Manual Verification Plan

After the automated tests pass, the final sign-off requires manual verification of the end-to-end workflow. This guide explains how to validate each pillar manually.

---

## 🏗️ Pillar 4: The Brain (AST & Diff)
**Goal**: Verify Zaxion understands code, not just text.

1.  **The "Eval" Test**:
    *   Create a file `test.js` with: `eval("alert('hack')");`
    *   Run Zaxion locally.
    *   **Verify**: Zaxion flags `DANGEROUS_EVAL` on the exact line.
2.  **The "AWS Key" Test**:
    *   Create a file `.env` with: `AWS_KEY=AKIAIOSFODNN7EXAMPLE`.
    *   Run Zaxion locally.
    *   **Verify**: Zaxion flags `HARDCODED_SECRET`.

---

## 📜 Pillar 6: The Constitution (Policies)
**Goal**: Verify the 10 core policies are active.

1.  **Dependency Check**:
    *   Add `"lodash": "3.10.1"` to `package.json`.
    *   **Verify**: Policy `SEC-002` blocks the change.
2.  **Coverage Check**:
    *   Add a new function `function untested() { return true; }` without a test file.
    *   **Verify**: Policy `QA-001` blocks for insufficient coverage.

---

## 🧪 Pillar 8: The Sandbox (Simulation)
**Goal**: Verify historical replay works.

1.  **Back-Test**:
    *   Run the "Simulation Mode" command (CLI).
    *   Feed it the last 5 commits of your repo.
    *   **Verify**: It generates a report: "2 Passed, 3 Blocked" without actually blocking anything.

---

## 🛠️ Pillar 2: The Helper (Remediation)
**Goal**: Verify developers get help, not just errors.

1.  **Docs Link**:
    *   Trigger a Secret Detection block.
    *   **Verify**: The output contains a clickable link to `zaxion.dev/docs/remediation/secrets`.
2.  **AI Advice**:
    *   (Requires API Key) Verify the block includes a code snippet showing how to use `process.env`.

---

## 🚦 Pillar 1: The Safety Switch (Rollout)
**Goal**: Verify safe adoption.

1.  **Observe Mode**:
    *   Set repo config to `OBSERVE_ONLY`.
    *   Commit a hardcoded secret.
    *   **Verify**: The PR check is **GREEN (Success)**, but the log shows "Violation Detected (Observed)".
2.  **Warn Mode**:
    *   Set repo config to `WARN_ONLY`.
    *   Commit a secret.
    *   **Verify**: The PR check is **NEUTRAL (Warning)**.
3.  **Enforce Mode**:
    *   Set repo config to `ENFORCE`.
    *   Commit a secret.
    *   **Verify**: The PR check is **RED (Failure)**.

---

## 📡 Pillar 3: Integration Surface
**Goal**: Verify alerts.

1.  **Slack Alert**:
    *   Force a `CRITICAL` violation (e.g., AWS Key).
    *   **Verify**: A message appears in the `#security-alerts` Slack channel.

---

## 📊 Pillar 7: Risk Intelligence
**Goal**: Verify long-term tracking.

1.  **Risk Score**:
    *   Trigger 10 violations in a row.
    *   **Verify**: The repository's "Risk Score" increases in the dashboard.
