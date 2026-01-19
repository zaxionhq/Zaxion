# PHASE 4 — THE CONSTITUTION OF GOVERNANCE

Status: ⚖️ SUPREME SOURCE OF TRUTH (DESIGN LOCK)
Date: 2026-01-19

This document serves as the constitutional framework for Phase 4 of Zaxion. It defines the core mission, the division of powers between the three pillars, the immutable invariants of the system, and the boundaries of its authority.

---

## 🔑 1. Core Mission
**Turn Zaxion from a single-decision engine into a trusted organizational governance system.**

Phase 4 moves beyond the technical question of "Can I prove why a PR was blocked?" to the organizational question of **"Can we trust this system at scale?"** It shifts the focus from automated logic to human law, policy accountability, and organizational memory.

---

## 🧱 2. The Three Pillars (Division of Powers)

The governance layer is divided into three distinct, decoupled registries:

### **Pillar 1: The Law (Policy Registry)**
- **Role**: A passive registry of what is allowed.
- **Responsibility**: Storage, versioning, and jurisdiction of policies.
- **Output**: The "Law" that the system is expected to observe.

### **Pillar 2: The Exception (Human Accountability)**
- **Role**: An immutable registry of human-signed overrides.
- **Responsibility**: Recording human intent and justification for bypassing the Law.
- **Output**: Cryptographically signed exceptions bound to specific actors and code states.

### **Pillar 3: The Memory (Decision & Pattern Engine)**
- **Role**: A historical ledger of what actually happened.
- **Responsibility**: Binding the Law (P1) to the Exception (P2) and recording the final Judgment (Decision).
- **Output**: Longitudinal patterns and informational signals for human review.

---

## 🔒 3. Cross-Pillar Invariants (The "Laws of Physics")

These invariants are non-negotiable and apply to the entire governance layer:

1.  **Total Immutability**: Every record in the system—Policies, Signatures, and Decisions—is immutable once written.
2.  **Append-Only Truth**: Historical data can never be deleted, hidden, or rewritten. New facts (new policy versions or superseded decisions) are appended as new records.
3.  **Binding Integrity**: Every Decision record must be explicitly bound to a specific `PolicyVersion` and, if an exception occurred, a specific `OverrideSignature`.
4.  **Passive Observation**: The governance layer does not perform active enforcement or logic-gating. It records the Law, the Exception, and the Result. The act of "Enforcement" is external to the registries.
5.  **Human-Centered Authority**: Policies are owned by human roles, and exceptions are signed by human actors. The system never "decides" to change its own rules.
6.  **Constitutional Separation**: No pillar may perform the duties of another. Pillar 1 cannot judge; Pillar 2 cannot define law; Pillar 3 cannot determine outcomes.

---

## 🚫 4. Explicit Non-Goals

To maintain focus and prevent logic creep, the following are explicitly out of scope for Phase 4:

- ❌ **Automated Enforcement**: Phase 4 does not build the "Police Force" (the logic that blocks GitHub PRs). It builds the "Law" and the "Courtroom Record."
- ❌ **AI Logic Improvements**: We are not making the AI smarter; we are making the human control and oversight more robust.
- ❌ **Actionable Recommendation**: The system does not "recommend" policy changes or "score" risk automatically. It provides raw signals for human judgment.
- ❌ **Management Dashboards**: We are building the data layer and APIs. Fancy visualizations and "analytics fluff" are non-goals.
- ❌ **Friction Removal**: Governance is about deliberate, accountable friction. We do not aim to make it "easy" to bypass the system.
- ❌ **Implicit Authority**: No metric, signal, or record may be interpreted as an instruction or mandate without explicit human decision-making.

---

## 🛑 5. Constitutional Guardrails

- **Auditability First**: Every outcome must be traceable back to a human-owned policy or a human-signed override with 100% certainty.
- **No Punishment Logic**: The system is for learning and accountability, not for automated punishment or performance tracking.
- **SHA-Locking**: All exceptions and decisions are cryptographically bound to a specific commit SHA to prevent truth-drift.
- **Jurisdiction Rules**: Repository rules can only *narrow* (make stricter) Organization rules; they can never weaken them.

---

**End of Constitution**
