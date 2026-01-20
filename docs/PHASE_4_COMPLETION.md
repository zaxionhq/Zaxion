# PHASE 4 COMPLETION — Internal Governance Contract

This document serves as the formal closure of **Phase 4 (Governance, Trust & Scale Layer)** and establishes the structural guarantees for all future development.

---

## 1. System Guarantees (What we now provide)

The system now guarantees three foundational layers of "Truth":

### A. The Law (Pillar 1: Policy Registry)
- **Immutability**: Once a Policy or PolicyVersion is written, it cannot be modified. Changes require a new version.
- **Strict Narrowing**: Child jurisdictions (Repos) can only make policies *stricter* than parent jurisdictions (Orgs), never more lenient.
- **Declarative Scope**: Every policy is bound to a specific target (Org/Repo) and has a clear enforcement level (MANDATORY, OVERRIDABLE, ADVISORY).

### B. The Exception (Pillar 2: Human Accountability)
- **Signed Exceptions**: Every bypass of a policy is recorded as an `Override` with at least one `OverrideSignature`.
- **Integrity Constraints**: Overrides are bound to specific commit SHAs and actor roles. An override is "internally consistent" or it is invalid.
- **Auto-Expiry**: Overrides are ephemeral and expire automatically upon code changes (SHA mismatch), ensuring no "permanent bypasses" exist.

### C. The Memory (Pillar 3: Organizational Memory)
- **Neutral Recording**: Every evaluation outcome is recorded as a `Decision`. The system remembers why something was blocked or allowed.
- **Causal Linking**: Decisions are linked to their predecessors, creating a replayable audit trail of a fact's lifecycle (e.g., a PR's evolution).
- **Statistical Signaling**: The system identifies patterns (e.g., "Bypass Velocity") as neutral informational signals without assigning blame.

---

## 2. Explicit Non-Goals (What the system does NOT do)

To prevent scope creep and preserve trust, Phase 4 strictly forbids:

- ❌ **Active Enforcement**: Phase 4 does *not* block PRs. It provides the registry and the memory. A separate "Enforcement Engine" (Phase 5/6) will consume these facts.
- ❌ **Runtime Inheritance Resolution**: The system does not calculate "effective policy" at runtime. It stores declarative intent.
- ❌ **Approval Workflows**: Pillar 2 records signatures; it does not manage a "Request -> Approve" UI workflow.
- ❌ **Subjective Judgment**: The system does not decide if an override is "good" or "bad"—only if it is "valid" (internally consistent).
- ❌ **Executable Metadata**: Metadata fields are for declarative information only; they must not contain logic, scripts, or evaluation rules.
- ❌ **Implicit Authority**: No metric, signal, or record may be interpreted as an instruction or mandate without explicit human intervention.

---

## 3. Future Assumptions (Internal Contract)

Future phases (Evaluation Engine, UI, Reporting) are allowed to assume:

1. **Append-Only Truth**: You never need to "update" a governance record. You only append new versions or new decisions.
2. **Fact Binding**: Every `Decision` can be traced back to exactly one `PolicyVersion` and (optionally) one `Override`.
3. **Passive Integrity**: If an `Override` is marked as `APPROVED`, you can trust the signature exists and the commit SHA matches, without re-validating the database.
4. **Information Neutrality**: Signals (like `BYPASS_VELOCITY`) are safe to display to users because they carry no blocking authority and use non-punitive language.
5. **Human at the Center**: The system provides the data, but the "Authority" for a bypass always rests with the human actor who signed the override.

---

**Phase 4 is LOCKED.**
*All backend components for Pillar 1, 2, and 3 are implemented and migrated.*
