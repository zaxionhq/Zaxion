# 🛡️ Zaxion Governance Policies

This document outlines the current governance policies enforced by Zaxion. Zaxion acts as a **CI Governor**, ensuring that every Pull Request (PR) adheres to organizational and repository-specific standards before it can be merged.

---

## 🔑 1. Core Principles

Zaxion's policy engine is built on three non-negotiable pillars:

1.  **Strict Determinism**: For a given set of code changes and a policy version, the result (PASS/BLOCK) is always the same.
2.  **AI as Advisor, Not Judge**: AI is used to analyze risk, suggest tests, and explain violations. However, the final PASS/BLOCK decision is made by deterministic, versioned rules.
3.  **Total Immutability**: Every policy version and decision is recorded in an immutable audit ledger.

---

## 🏛️ 2. Policy Hierarchy & Jurisdiction

Policies can be defined at two levels:

*   **Organization Level**: Global "Guardrails" that apply to all repositories. These ensure baseline standards across the entire company.
*   **Repository Level**: Specific rules for a single repository. 
    *   **Jurisdiction Rule**: Repository policies can only make rules **stricter** than organizational ones; they can never weaken them.

---

## ⚖️ 3. Enforcement Levels

Each policy is assigned an enforcement level that determines how it affects the PR mergeability:

| Level | Impact on PR | Override Capability |
| :--- | :--- | :--- |
| **MANDATORY** | PR is **BLOCKED** if violated. | Cannot be overridden by standard developers. |
| **OVERRIDABLE** | PR is **BLOCKED** if violated. | Can be bypassed with a maintainer's signature and justification. |
| **ADVISORY** | PR shows a **WARNING** but is not blocked. | No override needed (informational). |

---

## 🛠️ 4. Current Deterministic Policies

Zaxion currently implements the following policy checkers:

### **A. Test Coverage (Coverage)**
Ensures that new code changes are accompanied by corresponding tests.
*   **Rule**: Requires a minimum number of test files to be added or modified (Default: `min_tests = 1`).
*   **Status**: `BLOCK` if requirements are not met.

### **B. PR Size (PR Size)**
Prevents "Mega-PRs" that are difficult to review and pose a higher risk.
*   **Rule**: Checks the total number of changed files against a threshold (Default: `max_files = 20`).
*   **Status**: `WARN` if the threshold is exceeded.

### **C. Security-Sensitive Paths (Security Path)**
Protects critical infrastructure and configuration from unauthorized changes.
*   **Rule**: Restricts modifications to specific directories (Default: `auth/`, `config/`).
*   **Status**: `BLOCK` if changes are detected in these paths without explicit authorization.

### **D. File Extension Restrictions (File Extension)**
Ensures only approved file types are introduced into the codebase.
*   **Rule**: Only allows files with extensions specified in an allow-list.
*   **Status**: `BLOCK` if forbidden file types are detected.

---

## 🚀 5. Decision Flow & Statuses

When a PR is evaluated, Zaxion assigns it one of the following statuses:

*   ✅ **PASS**: All policies satisfied. Merge allowed.
*   ⚠️ **WARN**: Non-critical policy violations (ADVISORY) detected. Merge allowed.
*   ❌ **BLOCK**: Critical policy violations detected. Merge prevented.
*   🔓 **OVERRIDDEN_PASS**: A human maintainer has signed an override for a `BLOCK` status.

---

## 🔄 6. Rollout Modes

To ensure safe adoption, Zaxion supports three rollout modes:

1.  **`OBSERVE_ONLY`**: Policies run and record results, but do not affect the GitHub Check Run. Used for impact analysis.
2.  **`WARN_ONLY`**: Violations are reported as warnings on GitHub, but the PR is not blocked.
3.  **`ENFORCE`**: The policy verdict directly controls the GitHub Check Run status (Success/Failure).

---

## 📝 7. Future Updates
As Zaxion evolves, new policies (such as Branch-Level Rules or Cross-Repo Intelligence) will be added. This document will be updated whenever the policy engine is expanded.
