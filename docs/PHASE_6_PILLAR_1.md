# Phase 6: Pillar 1 — Decision Review & Explanation (The Glass Box)

## **1. Purpose**
Transform the raw JSON artifacts from Pillar 3 into a **Human-Readable Evidence Chain**. This ensures that when a developer is blocked, they can verify *exactly* why, against which facts, and according to which laws.

---

## **2. The Decision Review Object Model**
This is a read-only projection (The "Explanation Record") generated exclusively from persisted artifacts and never from live evaluation pipelines. It is derived from the `Final Decision Record` (Pillar 3.4).

```json
{
  "review_id": "REV-789",
  "decision_id": "DEC-456",
  "verdict_summary": "BLOCKED",
  "timeline": [
    {
      "step": "FACT_INGESTION",
      "timestamp": "2026-01-23T10:00:00Z",
      "status": "COMPLETE",
      "evidence": ["snapshot_hash_v1"]
    },
    {
      "step": "POLICY_RESOLUTION",
      "timestamp": "2026-01-23T10:00:01Z",
      "applied_policies": 3,
      "policy_version_ids": ["uuid-cov-2.1.0", "uuid-sec-1.4.2"] // Canonical IDs only; UI resolves friendly names
    },
    {
      "step": "JUDGMENT_EXECUTION",
      "timestamp": "2026-01-23T10:00:02Z",
      "violations": [
        {
          "policy_id": "uuid-cov-2.1.0",
          "policy_name": "Strict Coverage", // UI-resolved for readability
          "checker_id": "coverage_ratio",
          "expected": ">= 80%",
          "actual": "74%",
          "offending_fact_path": "metadata.coverage_ratio"
        }
      ]
    }
  ],
  "integrity": {
    "evaluation_hash_verified": true,
    "signed_by": "ZAXION_JUDGE_V1"
  }
}
```

---

## **3. Key Invariants**

1.  **Explanation Immutability**: The explanation for a decision must never change, even if the underlying policy is deleted or updated later. It is a "frozen" account of history.
2.  **Mechanical Traceability**: Every "Violation" in the UI must link directly to a field in the `FactSnapshot`. No "magic" or inferred failures.
3.  **Hash Transparency**: The UI must allow a user to verify that `hash(Snapshot + AppliedPolicies) == evaluation_hash`. The hash algorithm and concatenation order are defined in Phase 3 and immutable to prevent verification drift.
4.  **Enforcement Separation**: If an override exists, Pillar 1 displays both the immutable verdict and the override metadata without reconciling or normalizing them. The UI must not "soften" a block just because an override was applied.

---

## **4. Functional Components**

### **A. The Drill-Down Engine**
*   **Input**: `Final Decision Record`.
*   **Logic**: Maps `violated_policies.fact_path` to the actual value in the `FactSnapshot`.
*   **Output**: A "Diff-like" view showing (Reality vs. Law).

### **B. The Integrity Reporter**
*   **Function**: Re-calculates the `evaluation_hash` on the fly when the Review Page is loaded.
*   **UI Indication**: A "Verified" badge appearing only if the re-calculated hash matches the stored record.

---

## **5. Guardrails (Non-Goals)**

*   ❌ **No Re-Evaluation**: The Decision Review layer must never re-run policy logic or change verdicts. It only visualizes recorded outcomes. This prevents "fixing" verdicts in the UI or accidentally running newer engine versions against old facts.
*   ❌ **No Metadata Enrichment**: This layer must not fetch external data (e.g., current Jira status) that wasn't part of the original `FactSnapshot`.
*   ❌ **No Narrative Interpretation**: The "Download Evidence PDF" is a serialization of existing records, not a synthesized report. It must not contain narrative interpretation or legal commentary.

## **6. User Experience (UX) Goals**
*   **Zero Ambiguity**: Instead of "Tests missing", show "Fact: `test_files_changed_count` is 0. Policy: `requires_tests` is TRUE."
*   **Audit Readiness**: A "Download Evidence PDF" button that bundles the Snapshot, the Policy versions, and the Judge's signature.
