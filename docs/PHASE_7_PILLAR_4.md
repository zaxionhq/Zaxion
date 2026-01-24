# Phase 7: Pillar 4 — Operational Readiness & Trust Hardening (The Production Gate)

## **1. Purpose**
Before public launch, Zaxion must survive the rigors of production load, system failure, and skeptical security audits. This pillar establishes the contracts for:
1.  **Operational Safety**: Ensuring the system fails gracefully and survives high-load "PR Storms."
2.  **Forensic Explainability**: Providing deterministic proof of why any decision was made.
3.  **Security Trust Posture**: Hardening trust boundaries and authority delegation.

---

## **2. Core Capabilities**

### **A. Deterministic Replay (Forensics)**
*   **Capability**: Admins can re-run the exact `FactSnapshot` through the exact `EngineVersion` to reproduce a decision.
*   **Replay Invariants (Mandatory)**:
    1.  **Environment Determinism**: Replay must use the identical configuration, policy bundle version, and feature flags present at the time of the original decision.
    2.  **Read-Only Guarantee**: Replay mode is strictly forbidden from emitting new `Final Decision Records` or mutating any existing governance state. It is a visualization and verification tool only.
    3.  **Authorization & Audit**: Replay execution requires "Admin" role authorization and must be logged as a high-priority security audit event.

### **B. Backfill & Recovery (Resilience)**
*   **Capability**: Re-processing events from GitHub's webhook history to recover from database or infrastructure outages.
*   **Operational Rules**:
    1.  **Ordering Guarantee**: Events must be processed in causal order based on GitHub event timestamps.
    2.  **Deduplication**: The system must use the `evaluation_hash` to detect and ignore duplicate recovery attempts.
    3.  **Incomplete History Handling**: If GitHub history is incomplete (e.g., missing webhooks beyond retention), the system must mark the period as "UNVERIFIED" and trigger a manual audit alert. It must never "guess" missing state.

### **C. Retention & Redaction (Compliance)**
*   **Policy**: 90-day retention for `FactSnapshots`, 7-year retention for `Final Decision Records`.
*   **The Redaction Rule**: Redaction (purging sensitive data like commit messages) is **strictly prohibited** until the 90-day Deterministic Replay window has expired. Once redacted, the `FactSnapshot` is no longer replayable, and the record must be marked as "ARCHIVED/REDACTED."

---

## **3. Key Invariants (Testable Contracts)**
1.  **Alertable Failure**: Every failed evaluation or handoff must result in a `CRITICAL` log entry and an automated alert to the on-call engineer via a defined integration (e.g., PagerDuty). "Silent" means any failure that does not reach the persistence layer or the alert dispatcher.
2.  **Audit Integrity**: If a record cannot be persisted to the primary database, the system must block the current execution and write the raw event to an **Immutable Audit Log (DLQ)** before responding to GitHub.
3.  **Explainability Latency**: 99.9% of all `Final Decision Records` must be queryable and renderable (with full fact linkage) within < 2 seconds of a request from the Decision Review Page.

---

## **4. Degraded Mode & Kill Switches (Safety)**
In the event of partial system failure, Zaxion must prioritize "Business Continuity" over "Governance Strictness" unless explicitly configured otherwise.
*   **Fail-Open Default**: If the Judge or Persistence layer is unavailable, the system enters **`GLOBAL_OBSERVE_ONLY`** mode.
*   **Kill Switches**: Admins must be able to globally disable Zaxion enforcement (Kill Switch) via a signed emergency command.
*   **Branch Specificity**: Fail-open is active for all feature branches. Protected branches (e.g., `main`, `release/*`) may be configured to **Fail-Closed** (blocking PRs if Zaxion cannot verify them).

---

## **5. Trust Boundaries & Authority Matrix**
*   **Trusted Domain**: The **Zaxion Judge** and **Persistence Layer** (Immutable store).
*   **Authenticated but Untrusted**: The **GitHub API** (Input provider) and **AI Advisor** (Suggestion provider).
*   **Hostile Domain**: External networks and unauthenticated API consumers.
*   **Authority Matrix**:
    *   **Judge**: Sole authority for `Verdict` production.
    *   **Handoff Layer**: Sole authority for reporting status to GitHub.
    *   **Human Admin**: Sole authority for `Override` and `Policy Mutation`.

---

## **6. Operational Hardening**
*   **Load Testing**: Validating the Judge can handle 1,000+ concurrent evaluations without latency spikes > 500ms.
*   **SLA-Grade Observability**: Real-time dashboards showing:
    *   Evaluation Latency (p50, p95, p99).
    *   Persistence Success Rate.
    *   Override Frequency & Velocity.
    *   DLQ Depth (Unprocessed failures).

---

## **7. Outcome Goals**
*   **Platform Stability**: Zaxion survives "PR Storms" (hundreds of PRs submitted simultaneously).
*   **Audit Readiness**: The platform can undergo a SOC2 audit without manual spreadsheet hunting.
*   **Zero Ambiguity**: Every system behavior is backed by a deterministic record.

---

## **8. Explicit Non-Goals**
*   ❌ **No Data Mutation via Replay**: Replay must never change a historical decision.
*   ❌ **No "Black Box" Logic**: All operational failures must be traceable to a specific component or infrastructure bottleneck.
*   ❌ **No Automatic Fail-Closed on Non-Protected Branches**: To prevent developer friction, only protected branches may fail-closed.
