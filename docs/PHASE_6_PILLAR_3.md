# Phase 6: Pillar 3 — Policy Evolution & Simulation (The Blast Radius)

## **1. Purpose**
Prevent "Policy Shock." In an enterprise, you cannot simply change a coverage requirement from 50% to 80% overnight—it would block every active PR. Pillar 3 allows admins to **simulate** the impact of a new policy version before activating it.

---

## **2. The Simulation Engine**
A simulation is a "Dry Run" of the Judge (Pillar 5.3) using historical data.

```json
{
  "simulation_id": "SIM-202",
  "simulation_hash": "sim_hash_123", // hash(draft_policy + snapshot_ids + engine_version)
  "engine_version": "v1.2.0",
  "draft_policy_id": "POL-COV-3.0.0-DRAFT",
  "dataset": {
    "source": "PAST_30_DAYS",
    "total_snapshots": 150
  },
  "results": {
    "pass_rate_change": "-15%",
    "newly_blocked_prs": 22,
    "friction_index": "HIGH",
    "impacted_teams": ["auth-team", "billing-core"]
  }
}
```

---

## **3. Key Invariants**

1.  **Draft Isolation**: A "Draft" policy must never affect a live GitHub Check Run. It exists only in the Simulation sandbox.
2.  **Snapshot Replayability**: Simulations must use the *exact* `FactSnapshots` stored in Pillar 3 to ensure the simulation is scientifically accurate.
3.  **Simulation Determinism**: A simulation run must produce a `simulation_hash`. This ensures that results are verifiable, reproducible, and prevents "re-running until the numbers look good."
4.  **Engine Version Pinning**: Simulations must execute using an explicitly pinned Judge version. Draft policy results are invalid if the Judge version changes between simulation and promotion.
5.  **Blast Radius Threshold**: An enterprise setting may prevent activating a policy if the simulation shows a "Fail Rate Increase" > 20% without explicit VP-level approval.

---

## **4. Functional Components**

### **A. The Snapshot Replayer**
*   **Input**: A Draft Policy + a collection of historical `FactSnapshots`.
*   **Sample Size**: Configurable based on the desired confidence level (e.g., 100 for quick checks, 1000+ for compliance reviews).
*   **Sampling Strategy**: Explicitly selectable strategy:
    *   **Time-Based**: Last 30/90 days of snapshots.
    *   **Repo-Based**: Focus on high-risk or high-traffic repositories.
    *   **Risk-Based**: Sample snapshots that triggered previous policy violations.
*   **Logic**: Loops through snapshots and executes the Judge logic.
*   **Output**: A list of "What-If" verdicts.

### **B. The "Blast Radius" Reporter**
*   **UI**: A dashboard showing:
    *   **Current State**: 95% Pass Rate.
    *   **Proposed State**: 80% Pass Rate.
    *   **Affected Entities**: A list of PRs that are currently "GREEN" but would turn "RED" under the new law.
*   **Override Exclusion**: Overrides are explicitly excluded from simulation results. Executives must see the raw impact of the law, not the historical exceptions.

---

## **5. Evolution Workflow**
1.  **Draft**: Admin creates `v3.0.0-draft` of a policy.
2.  **Simulate**: Run against the last 100 snapshots using a pinned Judge version.
3.  **Adjust**: If too many PRs fail, tweak the parameters (e.g., set coverage to 75% instead of 80%).
4.  **Promote**: Once the Blast Radius is acceptable, promote `v3.0.0-draft` to `v3.0.0-active`.
5.  **Cool-Off Period**: Promotion requires a configurable cool-off period (e.g., 24 hours) after simulation approval to prevent knee-jerk policy changes.
6.  **Notify**: Automatically post a comment on active PRs: *"Note: A new policy v3.0.0 will take effect in 24 hours. Your PR may be impacted."*

---

## **6. Simulation Retention Policy**
*   **Immutability**: Simulation records, including their `simulation_hash` and results, are immutable once completed.
*   **Retention Period**: Records are retained for a configurable period (e.g., 90 days or 12 months) for audit trails and postmortem analysis of policy evolution.
*   **Archival**: After the retention period, records are purged or moved to cold storage, depending on compliance requirements.
