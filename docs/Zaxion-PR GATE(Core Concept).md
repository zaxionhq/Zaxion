# Zaxion PR GATE (Supreme Source of Truth)

**Status**: ⚖️ SUPREME SOURCE OF TRUTH (DESIGN LOCK)
**Version**: Phase 4 (Enterprise Governance)
**Date**: 2026-01-21

---

## 🔑 1. The Core Mission
**Turn Zaxion from a single-decision engine into a trusted organizational governance system.**

Zaxion is no longer just a "test generator." It is a **CI Governor**. It moves beyond the technical question of "Can I generate a test?" to the organizational question of **"Can we trust this PR to merge based on policy?"**

---

## 🧱 2. The Three Pillars (Division of Powers)

The Zaxion architecture is built on three distinct, decoupled registries that ensure accountability and trust:

### **Pillar 1: The Law (Policy Registry)**
- **Role**: A passive registry of what is allowed.
- **Responsibility**: Storage, versioning, and jurisdiction of policies.
- **Output**: The "Law" (PolicyVersion) that the system is expected to observe.
- **Reference**: [PHASE_4_PILLAR_1.md](file:///c:/Users/hamza/OneDrive/Desktop/hamza/github-testcase-generator-app/docs/PHASE_4_PILLAR_1.md)

### **Pillar 2: The Exception (Human Accountability)**
- **Role**: An immutable registry of human-signed overrides.
- **Responsibility**: Recording human intent and justification for bypassing the Law.
- **Output**: Cryptographically signed `OverrideSignatures` bound to specific actors and code states.

### **Pillar 3: The Memory (Decision & Pattern Engine)**
- **Role**: A historical ledger of what actually happened.
- **Responsibility**: Binding the Law (P1) to the Exception (P2) and recording the final Judgment (Decision).
- **Output**: The `DecisionObject` — a longitudinal record for human review and audit.

---

## 🔒 3. Cross-Pillar Invariants (The "Laws of Physics")

These invariants are non-negotiable and apply to the entire system:

1.  **Total Immutability**: Every record—Policies, Signatures, and Decisions—is immutable once written.
2.  **Append-Only Truth**: Historical data can never be deleted or rewritten. New facts are appended as new records.
3.  **Binding Integrity**: Every Decision must be explicitly bound to a specific `PolicyVersion` and, if an exception occurred, a specific `OverrideSignature`.
4.  **Passive Observation**: The governance layer records the Law, the Exception, and the Result. The act of "Enforcement" (blocking GitHub) is a downstream consumer of these records.
5.  **Human-Centered Authority**: Policies are owned by humans, and overrides are signed by humans. The system never "decides" to change its own rules.
6.  **Fail Closed**: If the Zaxion system is unavailable, the PR Gate must remain **BLOCKED**. Safety > Speed.

---

## 📝 4. The Decision Object (Phase 4 Spec)

The `DecisionObject` is the final, auditable output of the system. It must be serializable, deterministic, and explainable.

```json
{
  "repo": "org/payments",
  "prNumber": 142,
  "decision": "BLOCK",
  "decisionReason": "Deterministic policy blocked this PR due to missing tests in high-risk areas (auth, billing).",
  "policy_version": "1.2.0",
  "evaluationStatus": "FINAL",
  "facts": {
    "changedFiles": ["src/auth/login.ts", "src/billing/subscription.ts"],
    "testFilesAdded": 0,
    "affectedAreas": ["auth", "billing"],
    "totalChanges": 150,
    "isMainBranch": true,
    "hasCriticalChanges": true
  },
  "advisor": {
    "riskAssessment": {
      "level": "HIGH",
      "confidence": 0.85
    },
    "suggestedTestIntents": ["login.logic.check", "subscription.logic.check"],
    "rationale": "AI analysis confirms high-risk business logic changed without corresponding tests."
  },
  "ui": {
    "fix_link": "https://zaxion.app/resolve/12345"
  },
  "override": {
    "allowed": true,
    "requiredRole": "REPO_ADMIN",
    "justificationRequired": true
  },
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

## 🤖 5. The Role of AI: Advisor, Not Judge

Zaxion follows a strict separation of intelligence:

- **AI as Advisor**: AI is used for risk scoring, test strategy generation, and explaining violations to humans. It is probabilistic and non-authoritative.
- **Policy as Judge**: The final PASS/BLOCK decision is made by deterministic, versioned rules. It must be 100% repeatable. Same input + Same PolicyVersion = Same Decision.

**One-line rule**: AI can explain decisions — it must never make them.

---

## 🛠️ 6. Governance Primitives

1.  **Policy**: The "Law" defining success criteria for a PR.
2.  **Policy Version**: An immutable snapshot of a Policy.
3.  **Override**: A deliberate human intervention to bypass a block.
4.  **Override Signature**: The immutable audit trail of an Override (Who, When, Why, Which).
5.  **Jurisdiction**: Repo rules can only **narrow** (make stricter) Org rules, never weaken them.

---

## 🚀 7. Enforcement (PR Gate)

The PR Gate is the "Police Force" that implements the decisions of the Governance layer.

1.  **GitHub Check Runs**: Zaxion uses rich Check Runs to provide inline feedback, policy facts, and deep-links to the Resolution Workspace.
2.  **Resolution Workspace**: The sole authoritative entry point for PR resolution. Users cannot "fix" a violation in the legacy view; they must enter the audited courtroom environment.
3.  **Override Authorization**: Overrides are only valid if signed by a user with sufficient GitHub permissions (`admin` or `maintainer`).

---

## 🛑 8. Explicit Non-Goals

- ❌ **Automated Punishment**: The system is for learning and accountability.
- ❌ **Friction Removal**: Governance is about deliberate, accountable friction.
- ❌ **Implicit Authority**: No metric or signal is an instruction without human oversight.

---

**End of Zaxion PR Gate Core Concept (Phase 4)**
