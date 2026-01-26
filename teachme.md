# 🎓 Teach Me: Zaxion (The Governor)

Welcome to the educational guide for **Zaxion**. This document explains the core philosophy, architectural patterns, and governance mechanics that power the system.

---

## 🏛️ 1. The Core Philosophy: "From Tool to Governor"

Most AI tools are **Assistants**—they help you write code or tests. Zaxion is a **Governor**. 

- **Assistant Mode**: "I suggest you add a test here." (Phase 1-3)
- **Governor Mode**: "This PR is BLOCKED because it touches payment logic without a security test." (Phase 5+)

Zaxion moves the authority from "human intuition" to **"Deterministic Policy."**

---

## 🧱 2. The Five Pillars of Governance

Zaxion is built on a "Division of Powers" to ensure trust and accountability.

### **Pillar 1: The Law (Fact Ingestion)**
Extracts objective, immutable truths from your PR.
- **Goal**: What *actually* changed?
- **Invariant**: Determinism. Two different people looking at the same PR should see the same facts.

### **Pillar 2: The Policy (Resolution)**
Identifies which rules apply to those facts.
- **Hierarchy**: Organization Rules > Repository Rules.
- **Jurisdiction**: Does this file path fall under the "Security Policy"?

### **Pillar 3: The Judge (Evaluation Engine)**
A pure, stateless function that compares **Facts** against **Policy**.
- **Verdict**: PASS, BLOCK, or WARN.
- **No AI in the Verdict**: The decision is 100% deterministic code. AI is only used for *remediation* (helping you fix the violation).

### **Pillar 4: The Exception (Human Accountability)**
Sometimes the law is too strict. Humans can sign "Overrides."
- **Traceability**: Who signed the override? Why? For which specific commit?

### **Pillar 5: The Memory (Decision Handoff)**
Records the final decision in an immutable ledger before telling GitHub.
- **Causality**: If it's not in our database, it's not on GitHub.

---

## 🔄 3. The Lifecycle of a PR

1. **Webhook**: GitHub tells Zaxion "New PR created."
2. **Fact Snapshot**: Zaxion analyzes the diff and extracts facts (e.g., "Modified `auth.js`", "Coverage: 40%").
3. **Policy Binding**: Zaxion finds the relevant policies for that repo and path.
4. **Evaluation**: The Judge runs the facts through the policies.
5. **Verdict**: 
   - ✅ **PASS**: GitHub Check is green.
   - ❌ **BLOCK**: GitHub Check is red. Developer is invited to use the **Resolution UI** to fix it.
6. **Remediation**: AI generates the missing tests to help the developer get to a "PASS" state.

---

## ⚖️ 4. Why Determinism Matters?

If a governance system is "vibe-based" (probabilistic AI), developers will stop trusting it. 
- **Zaxion's Rule**: The *Gate* is deterministic (Code). The *Help* is probabilistic (AI).

You can always re-run a decision from 6 months ago and get the exact same result because every decision is bound to a specific **Policy Version** and **Fact Snapshot**.

---

## 🛠️ 5. Key Terms to Know

| Term | Definition |
| :--- | :--- |
| **Fact Snapshot** | An immutable record of the state of a PR at a specific commit. |
| **Policy Version** | A point-in-time version of a rule (e.g., "Policy v2"). |
| **Verdict** | The final status (PASS/BLOCK/WARN) of a PR evaluation. |
| **Decision Record** | The "Longitudinal Memory" — the permanent audit log of a verdict. |
| **Override** | A human-signed "Mercy" to bypass a block. |
