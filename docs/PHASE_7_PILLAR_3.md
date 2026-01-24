# Phase 7: Pillar 3 — Integration Surface & Ecosystem Hooks (The Distribution)

## **1. Purpose**
Zaxion must live where teams already work. This pillar defines the **read-only projections** of finalized governance outcomes into external systems. It ensures that the enterprise ecosystem has visibility into governance truth without ever possessing the authority to mutate it.

---

## **2. Supported Surfaces**

### **A. GitHub (Primary Surface)**
*   **Checks API**: Detailed summaries of policy violations and "Deep Links" to the Decision Review Page (Pillar 6.1).
*   **PR Comments**: Automated summaries for `WARN_ONLY` or `ENFORCE` failures.
*   **Annotations**: Inline code comments highlighting violation locations.
    *   **Invariant**: Annotations must reference **frozen facts** and **frozen violations** from the `Final Decision Record`. They must never re-run analysis or compute new deltas.

### **B. Communication Platforms (Severity-Tiered Routing)**
Integrations with Slack / MS Teams must follow a strict **Severity Contract** to prevent alert fatigue:
*   **INFO**: `PASS` or `OBSERVE_ONLY` outcomes (Optional/Opt-in digests).
*   **WARN**: `WARN_ONLY` violations or expiring overrides.
*   **CRITICAL / PAGE**: `BLOCK` verdicts on protected branches or **Override Signed** events (Immediate real-time alerts).

### **C. Task Management (Idempotency Contract)**
*   **Jira / Linear**: Automated ticket creation for persistent blocks.
    *   **Idempotency Rule**: One PR results in exactly one ticket per policy category. Subsequent evaluations of the same PR must **update** the existing ticket (comments/status), never create duplicates.
    *   **Traceability**: Every ticket must include a permanent link to the specific `Final Decision Record` (Phase 5).

### **D. Security & Compliance (Event Streaming)**
*   **SIEM Integration**: Streaming decision records to tools like Splunk or Datadog.
    *   **Contract**: These are **append-only event streams**. Records are emitted once and never mutated or deleted.
*   **Compliance Hooks**: Providing raw evidence for automated SOC2 or ISO audits.

---

## **3. Key Invariants**
1.  **Immutable Consumption**: Integrations must consume the `Final Decision Record` (Phase 5) and cannot rely on transient evaluation state.
2.  **Unidirectional State Flow**: No integration (Slack, Jira, etc.) can mutate the governance state or change a verdict. They are "View Only" projections.
3.  **Non-Blocking Integration Failures**: If an integration fails, it must **not** block the developer's PR or the GitHub Check Run.
    *   **Retry Policy**: System must implement exponential backoff with a maximum of 5 retries.
    *   **Dead-Letter Queue (DLQ)**: Failed integration events must be persisted to a DLQ for manual replay or audit, ensuring no loss of compliance evidence.
4.  **Async Boundary**: All integrations must execute outside the core evaluation request/response loop (Phase 5).
5.  **Delivery Semantics**: The system guarantees **at-least-once** delivery for critical alerts (e.g., Overrides) and **best-effort** for informational digests.

---

## **4. Integration Workflow**
1.  **Event**: Phase 5.4 (Decision Handoff) persists a `Final Decision Record`.
2.  **Trigger**: An **Async Integration Dispatcher** (outside the Judge process) detects the new record.
3.  **Action**:
    *   Dispatches to the GitHub API for Check Run updates.
    *   Enqueues tasks for downstream integrations (Slack, Jira, Webhooks).
4.  **Persistence**: Integration success/failure status is recorded as metadata alongside the `Final Decision Record` (but does not mutate the record itself).

---

## **5. Explicit Non-Goals**
*   ❌ **No Approvals via Integrations**: Users cannot "Approve" a PR or "Sign" an override via Slack or MS Teams. All signatures must happen on the Zaxion Platform to maintain cryptographic audit trails.
*   ❌ **No Inline PR Edits**: Integrations will never automatically fix code or push commits. They only suggest and explain.
*   ❌ **No Auto-Remediation**: Zaxion will not trigger "Auto-Fix" scripts in external CI systems via these hooks.
*   ❌ **No Re-Interpretation**: Integrations must never re-run policy logic. They only project recorded outcomes.

---

## **6. Value to the Enterprise**
*   **Workflow Integration**: Governance happens within the tools teams already love.
*   **Real-Time Awareness**: Security teams are alerted to overrides instantly, not days later.
*   **Audit Readiness**: Automated collection of evidence for compliance teams.
