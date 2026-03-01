# Phase 7: Pillar 7 — Repository Risk Intelligence & Historical Persistence (The Intelligence)

## **1. Purpose**
Zaxion transitions from an ephemeral PR gatekeeper into a longitudinal intelligence platform. This pillar ensures that every decision, fact, and override is preserved to provide organization-wide risk metrics and historical auditability.

---

## **2. Core Capabilities**

### **A. Longitudinal Risk Tracking**
*   **Capability**: Tracking the "Health Trend" of a repository over time based on policy violations and override frequency.
*   **Metrics**:
    *   **Violation Density**: Average violations per PR over a 30-day window.
    *   **Override Velocity**: Rate of overrides signed vs. PRs blocked.
    *   **Mean Time to Remediation (MTTR)**: Average time between a `BLOCK` verdict and a subsequent `PASS`.

### **B. Historical Decision Archive**
*   **Capability**: A permanent, queryable record of every `Final Decision Record` ever generated for a repository.
*   **Storage Invariant**: While `FactSnapshots` (raw code data) may be purged after 90 days for privacy, the `Final Decision Record` (verdicts, policy IDs, timestamps) is preserved indefinitely (or per compliance retention policy).
*   **Searchability**: Admins can search history by `PR ID`, `User`, `Policy Category`, or `Decision Outcome`.

### **C. Organization Risk Dashboard**
*   **Capability**: A high-level view for security and engineering leaders to identify "Hotspots" (repositories or teams with high violation rates).
*   **Features**:
    *   **Leaderboard**: Repositories with the highest compliance scores.
    *   **Watchlist**: Repositories trending downward in quality or security.
    *   **Policy Impact Analysis**: Visualizing how many PRs would be blocked if a specific `OBSERVE_ONLY` policy were moved to `ENFORCE`.

---

## **3. Key Invariants**
1.  **Non-Retrospective Modification**: Historical records are immutable. A change in policy today cannot change the "Verdict" of a PR from last month.
2.  **Anonymization Support**: For privacy-sensitive organizations, historical records can be anonymized (removing specific user IDs) while preserving aggregate risk data.
3.  **Data Integrity (Checksums)**: Every historical record must include a cryptographic checksum to detect unauthorized tampering in the persistence layer.
4.  **Zero-Retention Alignment**: Historical persistence must NEVER include raw source code or sensitive file contents, only the metadata and derived facts already approved for storage.

---

## **4. Data Model (Risk Intelligence)**
```json
{
  "repo_id": "org/repo-alpha",
  "snapshot_period": "2026-02-01 to 2026-02-28",
  "risk_score": 84.5,
  "aggregates": {
    "total_prs": 142,
    "total_blocks": 23,
    "total_overrides": 4,
    "top_violated_policies": [
      { "policy_id": "uuid-sec-1.4.2", "count": 12 },
      { "policy_id": "uuid-cov-2.1.0", "count": 8 }
    ]
  },
  "trends": {
    "compliance_delta": +2.4,
    "mttr_delta": -150 // Improvement in seconds
  }
}
```

---

## **5. Outcome Goals**
*   **Data-Driven Governance**: Decisions to tighten or loosen policies are based on real historical data, not intuition.
*   **Executive Visibility**: Leadership has a clear view of the organization's engineering standards and security posture.
*   **Audit Efficiency**: Compliance audits that used to take weeks of manual log hunting now take seconds of dashboard querying.

---

## **6. Explicit Non-Goals**
*   ❌ **No Developer Performance Rating**: Zaxion risk metrics are designed to improve system health, not to be used as a tool for individual performance reviews.
*   ❌ **No Predictive "Pre-Judging"**: The system reports historical facts and trends; it does not "predict" if a future PR will fail before it is submitted.
