# Phase 7: Pillar 1 — Progressive Adoption & Rollout Controls (The Safety Switch)

## **1. Purpose**
Enterprises never deploy governance tools globally on day one. This pillar ensures controlled adoption without blast radius risk. It allows organizations to observe the impact of Zaxion before enforcing it.

---

## **2. Rollout Modes**
Zaxion supports three distinct enforcement states at the repository or organization level:

1.  **`OBSERVE_ONLY`**:
    *   **Behavior**: The Judge runs, records are stored, and metrics are generated, but no GitHub Check results are blocked.
    *   **Visibility**: 
        *   **Admin Dashboard**: Full visibility into failures and impact.
        *   **PR Annotation (Optional/Informational)**: A collapsed or informational comment stating: *"Zaxion ran in Observe Mode — no enforcement applied."* This prevents developer distrust while maintaining non-disruption.
    *   **Goal**: Gather baseline data and identify "False Positive" risks without disrupting developers.
2.  **`WARN_ONLY`**:
    *   **Behavior**: The Judge runs and reports results to GitHub as "Neutral" or "Warning." 
    *   **Visibility**: Developers see the violations in the PR, but the PR is not blocked from merging.
    *   **Goal**: Educate developers on upcoming policy changes.
3.  **`ENFORCE`**:
    *   **Behavior**: The Judge's verdict directly controls the GitHub Check Run status (Success/Failure).
    *   **Visibility**: Full visibility and enforcement.
    *   **Goal**: Final production governance.

---

## **3. Key Invariants**

1.  **Precedence Order (Most Permissive Wins)**: 
    When rollout modes conflict across levels, the system resolves enforcement using this hierarchy (the least restrictive mode applies unless explicitly escalated):
    1.  **Organization default mode** (Baseline safety)
    2.  **Repository rollout mode**
    3.  **Policy-specific rollout override**
    *   **Escalation Rule**: Policy-level enforcement escalation beyond the repository's current mode requires explicit admin approval and is logged as a `RolloutDecisionRecord`.
    *   *Rationale: This ensures that a single policy cannot block PRs if the organization or repository has explicitly chosen an observation-only period.*

2.  **Fail-Open Default**: If the Adoption Registry is unavailable, the scheduler fails, or the resolver times out, the system must default to **`OBSERVE_ONLY`**. This prevents accidental global outages during system partitions.
3.  **Prior Observation Requirement**: No policy or repository may enter `ENFORCE` mode without meeting the **Promotion Evidence Requirement**:
    *   **Observation Duration**: Minimum period (e.g., 7 days) met.
    *   **Failure Rate Threshold**: Total failures must be below a configurable percentage (e.g., < 20%) to avoid overwhelming teams.
    *   **Override Velocity**: The rate of human overrides must be within acceptable limits (indicating policy clarity).
4.  **Transition Cool-Off Enforcement**: A minimum "dwell time" is required per mode (e.g., 72 hours in `WARN_ONLY`) before advancing to the next level. This prevents "flip-flopping" and panic enforcement.
5.  **Mode Drift Detection (Guardrail)**: Any new policy added to the system automatically inherits the current rollout mode of the repository, not the global default. This prevents a repo in `OBSERVE_ONLY` from suddenly being blocked by a new `ENFORCE` policy.
6.  **Rollout State Immutability**: The resolved rollout mode at the time of evaluation must be recorded in the `Final Decision Record`.
7.  **Kill-Switch Scope**: The emergency rollback mechanism must be configurable by scope:
    *   **Org-wide**: Revert all repositories.
    *   **Selected Repositories**: Revert specific high-traffic or high-risk repos.
    *   **Selected Policy Categories**: Revert only specific categories (e.g., `SECURITY` or `COMPLIANCE`).
    *   **Canary Repositories (Non-binding concept)**: A subset of repos may act as rollout canaries for testing new enforcement levels.

---

## **4. Functional Components**

### **A. Adoption Resolver**
*   **Logic**: Before the Handoff Layer (Pillar 5.4) publishes a status to GitHub, it queries the **Adoption Registry** for the current mode of the repository.
*   **Output**: The final status reported to GitHub (e.g., if mode is `WARN_ONLY`, a `BLOCK` verdict becomes a `NEUTRAL` status).

### **B. Rollout Scheduler**
*   **Capability**: Allows admins to schedule transitions (e.g., "Move Repo X to ENFORCE on Feb 1st").
*   **Safety Check**: Automatically halts a transition if the `OBSERVE_ONLY` phase shows a failure rate > 50% (The **Safety Halt Threshold**).

### **C. Rollout Decision Snapshot**
*   **Purpose**: Persist the "Why" behind a rollout transition for audits and postmortems.
*   **Artifact**: A `RolloutDecisionRecord` containing:
    *   **Trigger**: Manual, Scheduled, or Automated (refers only to threshold-based safety halts, never auto-promotion).
    *   **Pre-transition Metrics**: Failure rate, override density, and team friction index.
    *   **Outcome**: Completed, Halted, or Aborted.
    *   **Actor**: The human or system process that initiated the change.

---

## **5. Configuration Model**
```json
{
  "repo_id": "org/repo-alpha",
  "rollout_config": {
    "current_mode": "WARN_ONLY",
    "history": [
      { "mode": "OBSERVE_ONLY", "started_at": "2026-01-01T00:00:00Z" },
      { "mode": "WARN_ONLY", "started_at": "2026-01-15T00:00:00Z" }
    ],
    "scheduled_transitions": [
      { "target_mode": "ENFORCE", "at": "2026-02-01T00:00:00Z" }
    ],
    "policy_overrides": {
      "uuid-sec-1.4.2": "OBSERVE_ONLY" // Specific policy lagging behind global enforcement
    }
  }
}
```

---

## **6. Prevention Goals**
*   **Zero Organization-Wide Outages**: By enforcing repo-level and policy-level rollouts.
*   **No Unplanned Tool Removal**: Developers are warned well before their workflow is interrupted.
*   **Executive Confidence**: Data-backed decisions on when to tighten the screws.

---

## **7. Explicit Non-Goals**
*   ❌ **No Per-Developer Rollout Modes**: Rollout is managed at the Repository, Team, or Policy level, never at the individual user level (to prevent bias and complexity).
*   ❌ **No ML-Driven Transitions**: Rollout transitions must be deterministic (Scheduled or Manual) or based on simple threshold safety checks. No "black box" ML models deciding when to enforce.
*   ❌ **No Auto-Enforcement Without Human Approval**: Transitions to `ENFORCE` require a human-in-the-loop or a pre-approved schedule based on observation data.
