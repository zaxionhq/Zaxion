# Phase 6: Pillar 2 — Scoped Overrides & RBAC (The Signature)

## **1. Purpose**
Move from "Silent Bypasses" to **Governance-Aware Overrides**. In an enterprise, an override is not a "Skip" button; it is a temporary, signed permission to deviate from the law for a specific reason and duration.

---

## **2. The Override Signature Model**
An override is no longer a simple flag. It is a **Transaction Record** bound to a specific evaluation state.

```json
{
  "override_id": "OVR-101",
  "decision_id": "DEC-456",        // Link to the canonical Governance Record (Pillar 3)
  "evaluation_hash": "hash_xyz_789", // Cryptographic binding to the exact code/policy state
  "actor": {
    "user_id": "ADMIN-99",
    "role": "SECURITY_LEAD"
  },
  "scope": {
    "type": "COMMIT", 
    "target": "sha-abc-123"
  },
  "justification": {
    "category": "EMERGENCY_HOTFIX",
    "reason": "Fixing production outage, tests will be added in follow-up PR #900"
  },
  "expiration": {
    "ttl_hours": 4,
    "expires_at": "2026-01-23T14:00:00Z"
  }
}
```

---

## **3. Key Invariants**

1.  **Scope Confinement**: An override granted for `commit_sha_A` must never automatically apply to `commit_sha_B`. If the developer pushes a new commit, the Judge must re-evaluate.
2.  **Evaluation Hash Binding**: The override is strictly bound to the `evaluation_hash`. If the policy version changes or the engine logic is updated (resulting in a different hash), the override is automatically invalidated. Overrides are contextual, not reusable privileges.
3.  **Override Immutability**: Once created, an Override Signature cannot be edited or extended. Any change (e.g., TTL extension or justification update) requires the creation of a new, separate override record. Overrides are append-only facts, not mutable permissions.
4.  **Temporal Expiry**: Every override must have a TTL. "Permanent Overrides" are a policy failure and must be flagged in Pillar 6.4.
5.  **Role-Based Authority (RBAC)**: Only users with the `POLICY_OVERRIDER` role for a specific repository can sign an override. RBAC resolution is performed against repository-scoped policy configuration defined in Phase 5. A developer cannot override their own block unless explicitly permitted by repo settings.
6.  **Governance Visibility**: Override metadata is rendered in Pillar 1 as a parallel governance layer and is never merged into or used to "soften" the violation explanation.

---

## **4. Functional Components**

### **A. Override Applicability Resolver**
*   **Location**: Phase 5 — Pillar 4 (Decision Handoff)
*   **Logic**: Determines whether a recorded `EvaluationResult` should be published as `SUCCESS` or `FAILURE` based on the presence of a valid `OverrideSignature`.
*   **The Purity Rule**: The Judge (Pillar 5.3) never checks overrides. Overrides are applied *after* evaluation, during the decision publication phase. The Judge remains a pure evaluator of facts vs. laws.

### **B. The "Bypass" Workflow**
*   **UI**: When a PR is blocked, the "Request Override" button triggers a form requiring:
    1.  Categorization (e.g., False Positive, Emergency, Legacy Code).
    2.  Justification text.
    3.  A "Signature" (re-authentication or MFA if required by enterprise).
*   **Enforcement State**: 
    - `verdict`: Remains `BLOCK` (The truth of the violation is immutable).
    - `final_status`: Becomes `SUCCESS (OVERRIDDEN)` (The governance action is applied).

### **C. Manual Revocation (The Kill-Switch)**
*   **Logic**: Overrides may be revoked early by users with a higher RBAC tier (e.g., Security Admin). 
*   **The Revocation Record**: Revocation does not mutate the `OverrideSignature`. It creates a separate **RevocationRecord**.
    ```json
    {
      "revocation_id": "REVOC-33",
      "override_id": "OVR-101",
      "revoked_at": "2026-01-23T12:30:00Z",
      "revoked_by_actor_id": "SECADMIN-7",
      "reason": "Incident resolved early"
    }
    ```
*   **Validity Check**: An override is considered valid only if:
    1.  `OverrideSignature` exists and scope matches.
    2.  TTL has not expired.
    3.  **No corresponding `RevocationRecord` exists.**

---

## **5. Governance Goals**
*   **Auditability**: Every override creates a permanent audit trail.
*   **Velocity Balance**: Allows teams to move fast during outages without disabling the entire security gate.
*   **Accountability**: The "Actor" (the person who clicked Override) is forever linked to that decision.
