# Phase 7: Pillar 2 — Developer Experience & Remediation Intelligence (The Helper)

## **1. Purpose**
If Zaxion only blocks, developers will bypass it. This pillar turns violations into actionable guidance, helping developers fix issues faster and reducing the need for overrides.

### **Naming Taxonomy (The Helper Umbrella)**
To ensure architectural clarity, all components in Pillar 2 follow this frozen taxonomy:
*   **The Helper**: The overall human-facing layer (Pillar 2 umbrella).
*   **The Renderer**: Deterministic, template-based remediation engines.
*   **The Advisor**: AI-backed, non-deterministic remediation engines (e.g., `RemediationAdvisor`).

---

## **2. Core Capabilities**

### **A. Violation-Specific Remediation Hints (The Renderer)**
*   **Definition**: Every policy version (Phase 5.2) can optionally include a `remediation_hint` template.
*   **Rendering**: The Judge (Pillar 5.3) is strictly forbidden from populating templates. It only emits a `ViolationRecord` with structured facts. The **Remediation Renderer** populates templates using the immutable `FactSnapshot` post-decision.
*   **Example**: 
    *   *Violation facts*: `actual: 74%`, `required: 80%`, `file: src/auth/service.ts`.
    *   *Rendered Hint*: "You need to add ~12 lines of test code to `src/auth/service.ts`. Try adding a unit test for the `handleError` function."

### **B. Policy-Linked Playbooks**
*   **Feature**: Links to internal company documentation or "How to Fix" guides for complex violations (e.g., Security Path violations).
*   **Benefit**: Standardizes remediation across the organization.

### **C. AI-Assisted Explanations (The RemediationAdvisor)**
*   **Function**: Uses LLMs to explain *why* a block occurred and suggest code changes.
*   **Constraint**: These suggestions are clearly labeled as "Advisory" and have no authority over the verdict.
*   **Confidence Guardrail**: The `confidence_score` represents the model’s internal confidence that the suggested fix is **syntactically and contextually valid**, not that it is correct or complete. It has zero relationship to the verdict confidence or the validity of the block.

---

## **3. Key Invariants**

1.  **Post-Decision Execution**: Pillar 2 only executes after a verdict is finalized and frozen. It must never run pre-decision to ensure no re-interpretation of facts occurs during the judging phase.
2.  **Remediation Immutability (Versioning)**: Remediation output is versioned and immutable per verdict. Once advice is rendered and persisted for a specific `decision_id`, it must never change, even if templates or AI models improve later. This protects auditability.
3.  **Non-Authoritative Suggestions**: Suggestions (AI or template-based) must never affect the Judge's verdict.
4.  **Deterministic Traceability**: Every explanation must be mechanically traceable to the facts. No "hallucinated" reasons for a block.
5.  **Failure Degradation (Safety First)**: The system must fail gracefully to avoid blocking CI or confusing developers:
    *   If **Renderer (Template)** fails -> Show raw violation facts only.
    *   If **Advisor (AI)** fails/times out -> Omit the AI section silently.
    *   If **Playbook URL** is missing -> Continue rendering without the link.
6.  **Read-Only Advisor**: The AI layer cannot mutate the code or the governance record; it can only provide text/code suggestions for the developer to review.
7.  **Suggestion Provenance Invariant**: Every remediation element must explicitly declare its source (`FACT_DERIVED`, `TEMPLATE`, or `AI_INFERRED`).
8.  **No New Information Rule (AI)**: AI advice may only reference facts explicitly present in the `FactSnapshot` or `ViolationRecord`.
9.  **UX Priority (Nudge Policy)**: Remediation output must be presented to the developer *before* override options are displayed.
10. **Override Acknowledgment**: The override flow must require the user to acknowledge that they have reviewed the remediation advice. This prevents "click-through" overrides.
11. **Configurable AI Surface**: AI-assisted explanations are optional, configurable, and may be disabled per organization to manage cost and privacy.
12. **Privacy Guardrail (AI Advisor)**: The AI Advisor must never log or retain source code outside the immediate decision scope.
13. **Cost Guardrail (AI Advisor)**: The system must enforce maximum tokens or compute limits per remediation event to prevent runaway operational costs.

---

## **4. Remediation Object Model**
```json
{
  "remediation_id": "REM-789",
  "decision_id": "DEC-456",
  "violation_id": "VIO-123",
  "policy_id": "uuid-cov-2.1.0",
  "metadata": {
    "rendered_at": "2026-01-23T10:00:00Z",
    "renderer_version": "1.4.2",
    "advisor_model_id": "gpt-4-0613" // Logical model identifier or fully qualified runtime model
  },
  "remediation": {
    "hint": {
      "source": "TEMPLATE",
      "text": "Add tests to src/auth/service.ts"
    },
    "playbook_url": "https://wiki.corp.com/testing-standards",
    "ai_advice": {
      "source": "AI_INFERRED",
      "explanation": "Your recent changes added a complex switch statement without corresponding test coverage.",
      "suggested_fix": "```typescript\n// Example test for service.ts\ndescribe('AuthService', () => { ... })\n```",
      "confidence_score": 0.89
    }
  },
  "feedback_signal": {
    "is_helpful": null,
    "override_occurred": false
  }
}
```

## **5. Delivery Surfaces**
Pillar 2 outputs are presentation-agnostic but optimized for **PR-first consumption**. Primary delivery surfaces include:
*   **GitHub PR Comments**: Direct feedback on the PR thread.
*   **GitHub Check Run Details**: Rich markdown reports linked to the check status.
*   **CLI Output**: Local feedback for developers running Zaxion pre-push.

---

## **7. Passive Feedback Loop (The Learning Signal)**
To improve remediation quality without affecting current governance, Pillar 2 captures passive signals for Phase 8+ intelligence:
*   **Helpfulness Signal**: A non-blocking "Was this helpful?" (Yes/No) on the delivery surface.
*   **Friction Metrics**: 
    *   **Override-after-advice ratio**: Did the developer override despite seeing a high-confidence fix?
    *   **Time-to-fix**: The duration between remediation display and the next successful evaluation.
*   **Constraint**: These signals are metadata only. They **must never** feed back into the live Judge or mutate the immutable record of the decision.

---

## **8. Outcome Goals**
*   **Reduced Toil**: Developers spend less time guessing why they are blocked.
*   **Fewer Overrides**: By making the fix easier than the override process.
*   **Higher Trust Score**: Developers see Zaxion as a pair-programmer rather than a gatekeeper.
