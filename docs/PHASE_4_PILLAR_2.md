# PHASE 4 — PILLAR 2: HUMAN ACCOUNTABILITY (DETAILED DESIGN)

Status: 📝 DESIGN LOCK (DO NOT CODE)
Date: 2026-01-19

This document locks the invariants and object model for **Pillar 2: Human Accountability**. Pillar 2 is an immutable registry of human-signed exceptions, cryptographically bound to time, role, and code state — with zero enforcement authority.

---

## 🔒 Step 1: Pillar 2 Invariants (The Non-Negotiables)

These invariants ensure that human intervention is transparent and accountable:

1.  **Immutable Signatures**: An `OverrideSignature` can never be edited or deleted once created.
2.  **No Self-Approval**: A user cannot approve their own `OverrideRequest` for `OVERRIDABLE` policies.
3.  **PR-Specific Scoping**: An override applies strictly to a single Pull Request and expires upon merge.
4.  **Commit-Specific Invalidation**: Any new commit pushed to a PR automatically invalidates existing overrides, requiring re-justification.
5.  **Role-Gated Authority**: Overrides must be signed by a role with sufficient authority (e.g., `Repo-Lead` or `Senior-Dev`).
6.  **Justification Requirement**: Every override MUST contain a human-written "Why" of at least 10 characters.
7.  **Visibility Asymmetry**: High-privilege overrides (by Admins/Managers) are subject to mandatory peer-review or automatic flagging for higher-level audit.
8.  **Passive Status**: Override status is a recorded fact, not an enforcement outcome. Pillar 2 never determines whether an override is honored.

---

## 🏗️ Step 2: Override Object Model (Minimal)

### **1. Override**
The intent to bypass a policy violation.
- `id`: UUID
- `subject_ref`: JSON (What is being overridden)
    - `type`: `"PR_CHECK"` | `"POLICY_EVALUATION"`
    - `external_id`: String (The ID of the check or evaluation)
- `policy_version_id`: UUID (The exact law version being bypassed)
- `status`: `PENDING` | `APPROVED` | `REJECTED` | `EXPIRED`
    - *Note: status reflects the state of the record, not approval semantics. APPROVED means “a valid human signature exists,” not “the system will allow a bypass.”*
- `created_at`: Timestamp

### **2. OverrideSignature**
The "Fingerprint" of the human actor who authorized the bypass.
- `id`: UUID
- `override_id`: UUID
- `actor_id`: UserID
- `role_at_signing`: String (e.g., "repo-lead")
- `justification`: Text
- `timestamp`: Timestamp
- `commit_sha`: String (The exact commit SHA the signature is valid for)

---

## 🛠️ Step 3: Build Strategy (Accountability Only)

Implementation is strictly limited to the "Paper Trail":

1.  **Signature Schema**: Database tables for `Override` and `OverrideSignature`.
2.  **Integrity Constraints**: Engine to verify internal consistency of a record:
    - `commit_sha` must match the PR state at signing time.
    - `actor_role` must be valid at signing time.
    - `timestamp` must be linear.
3.  **Auto-Expiry Hooks**: Background or event-driven logic to mark overrides as `EXPIRED` when new commits arrive or the PR is closed.

**DO NOT build:**
- ❌ UI for requesting overrides.
- ❌ Automatic bypass of GitHub Checks.
- ❌ Multi-approval workflows (keep it single-signer for now).
    
---

## 🛑 Step 4: Governance Guardrails

- **Auditability First**: Pillar 2 is complete when we can prove *who* bypassed *what* and *why* with 100% cryptographic certainty.
- **No Friction Reduction**: Do not make it "easy" to override. Governance is about deliberate, accountable friction.
- **SHA-Locking**: A signature is worthless if it doesn't lock to a specific commit SHA.
