# PHASE 2 — CORE PR GATE (LOCKED)

Status: ✅ COMPLETE
Date locked: 2025-12-29

This phase implements the core PR Gate pipeline.
No behavior in this phase should change without explicit approval.

---

## Supported GitHub Events

The system MUST support only the following events:

- `pull_request.opened`
- `pull_request.synchronize`
- `pull_request.reopened`

Any new event requires a new phase.

---

## PR Identity Contract

Each PR decision is uniquely identified by:

- `repo_owner`
- `repo_name`
- `pr_number`
- `commit_sha` (head SHA)

If `head_sha` is missing → **hard fail**.

---

## Check Run States (Frozen)

Allowed states (Mapping to GitHub API):

- `in_progress` (Mapping to system `PENDING`)
- `completed` (Mapping to system `PASS`, `BLOCK`, `WARN`, `OVERRIDDEN_PASS`)

Allowed conclusions:

- `success` (PASS, OVERRIDDEN_PASS)
- `failure` (BLOCK)
- `neutral` (WARN)

No other state or conclusion is valid without updating this lock.

---

## Decision Definitions

The system supports a fixed set of outcomes. Each has a specific semantic meaning:

- `PENDING`: Analysis is in flight. No final decision has been reached.
- `PASS`: The PR meets all automated policy requirements.
- `BLOCK`: The PR violates a hard policy. Merging should be restricted.
- `WARN`: The PR has minor issues or system-level warnings (e.g., version drift) but is not explicitly blocked.
- `OVERRIDDEN_PASS`: A `BLOCK` or `WARN` decision was manually bypassed by an authorized user.

---

## Policy Versioning Contract

The `policy_version` field is the "Soul of the Decision":

- **Definition**: It represents the exact snapshot of the Policy Engine logic used to evaluate the PR.
- **Immutability**: Once a decision is initialized with a version, that version **CANNOT** be changed for that specific SHA.
- **Drift Detection**: If the system's global version changes while an analysis is in flight, the update MUST fail (Fatal Signal).

---

## Immutable Constraints (What Cannot Change)

To maintain Phase 2 integrity, the following are strictly prohibited:

1. **Retroactive Updates**: You cannot change a `PASS`/`BLOCK` decision back to `PENDING`.
2. **Version Mismatch**: You cannot update a row if the `policy_version` in the DB does not match the `policy_version` of the analyzer.
3. **Identity Shadowing**: You cannot have two different decisions for the same `repo_owner + repo_name + pr_number + commit_sha`.
4. **LIMBO States**: A `PENDING` state must eventually transition to a final state or be flagged by a watchdog (via `started_at`).

---

## Database Contract (Frozen)

Table: `pr_decisions`

Fields:
- `repo_owner`
- `repo_name`
- `pr_number`
- `commit_sha`
- `policy_version`
- `decision`
- `reason`
- `raw_data`
- `created_at`
- `updated_at`

Schema is frozen.

---

## Failure Mode

- If webhook verification fails → **reject** (401/403)
- If GitHub check update fails → **fail CLOSED** (BLOCK PR in logs/state)
- If DB write fails → **fail CLOSED** (Transaction Rollback)

---

## Logging Contract

Every request MUST log:

- `trace_id` = `<installation_id>:<commit_sha>`
- `event_type`
- `pr_number`

This is required for production debugging.

---

## Rationale

Phase 3 (AI Test Generation) depends on this behavior being stable.
Any regression here invalidates higher-level logic.
This file acts as a guillotine for future changes: if this logic is touched, it must be a deliberate, documented architectural decision.
