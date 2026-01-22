# PHASE 5 — PILLAR 3: EVALUATION ENGINE (THE JUDGE)

**Status**: 📝 DESIGN LOCK (DO NOT CODE)
**Date**: 2026-01-22

This document defines the architecture for **Pillar 5.3: Evaluation Engine**. This is the core "Judge" of the system. It takes the Facts (Pillar 5.1) and the Laws (Pillar 5.2) and produces a deterministic Evaluation Outcome.

---

## 🔒 Step 1: Pillar 5.3 Invariants (The Non-Negotiables)

1.  **Strict Determinism**: `Evaluation(Facts, Policies, EngineVersion) -> Outcome`. This function must be pure. No network calls, no database lookups, and no random numbers during the execution of the evaluation logic.
2.  **Zero AI in the Verdict**: The final `PASS/BLOCK/WARN` result must be calculated using 100% deterministic code. AI is relegated to the "Advisor" role (providing rationale or suggestions) but cannot hold the gavel.
3.  **Explainability**: Every `BLOCK` or `WARN` must be accompanied by a `rationale` that explicitly cites the violated policy and the specific fact that triggered it.
4.  **Versioned Logic**: The Evaluation Engine itself must have a semantic version (e.g., `v1.2.0`). Any change to the evaluation code requires a version bump.
5.  **Statelessness**: The engine does not know about previous evaluations. It evaluates the current snapshot in isolation.
6.  **Policy Verdict Contract**: Every checker must return a `{ verdict, severity }` tuple. The `severity` (e.g., `BLOCK`, `WARN`) is declared by the policy version itself, not inferred by the Judge. The Judge acts as the executor of these verdicts, not their interpreter.
7.  **Closed-World Evaluation**: The Judge must receive all necessary policy data (parameters, severity, logic type) as input. It is strictly forbidden from querying Pillar 5.2 or Pillar 1 during evaluation.

---

## 🏗️ Step 2: Evaluation Object Model

### **1. Evaluation Result**
The final output of the Judge.
- `id`: UUID
- `fact_snapshot_id`: UUID (Reference to Pillar 5.1)
- `applied_policies`: Object[] (The fully resolved laws from Pillar 5.2)
    - `policy_version_id`: UUID
    - `level`: `MANDATORY` | `OVERRIDABLE` | `ADVISORY`
    - `policy_type`: String (e.g., "coverage", "security_path")
    - `parameters`: JSON (The raw rules/thresholds)
    - `resolution_reason`: String
- `result`: `PASS` | `BLOCK` | `WARN`
- `rationale`: String (Plain English explanation)
- `violated_policies`: Object[]
    - `policy_version_id`: UUID
    - `checker`: String (The internal engine checker name)
    - `fact_path`: String (The specific field in the FactSnapshot that triggered the violation)
    - `expected`: String (The threshold or rule required)
    - `actual`: String (The reality found in the facts)
    - `message`: String (Human-readable error)
- `evaluation_hash`: String (SHA-256 of the input facts + applied policy data + engine version)
- `engine_version`: String (e.g., "1.0.0")
- `timestamp`: Timestamp

### **2. Advisor Advice (The AI Layer)**
Optional metadata provided alongside the deterministic result.
- `risk_score`: Float (0.0 to 1.0)
- `suggested_tests`: String[]
- `ai_rationale`: String

---

## 🛠️ Step 3: Build Strategy (The Judge's Chambers)

1.  **Rule Processor**: A registry of deterministic "Checkers" (e.g., `CoverageChecker`, `SecurityPathChecker`, `FileExtensionChecker`).
2.  **Outcome Aggregator**: Logic to combine multiple policy results:
    - If any `MANDATORY` policy returns `BLOCK` -> Result is `BLOCK`.
    - Else if any policy returns `WARN` -> Result is `WARN`.
    - Else -> Result is `PASS`.
3.  **Rationale Generator**: A template-driven system that builds the `rationale` string based on the specific checkers that failed.
4.  **Advisor Service**: A separate, non-blocking service that calls the AI model to generate "Advice" based on the same `FactSnapshot`.

---

## 🛑 Step 4: Guardrails (Non-Goals)

- ❌ **No Persistence**: The Judge does not save its own results. It returns the payload to the Handoff layer (Pillar 5.4).
- ❌ **No External Data**: Do not fetch anything during evaluation. All data must be passed in as part of the Facts or Policies.
- ❌ **No Human Interaction**: The Judge does not wait for user input. It is an automated engine.
- ❌ **No Enforcement**: The Judge does not "block" the PR on GitHub. It only says "I think this should be blocked."

---

**End of Pillar 5.3 Detailed Design**
