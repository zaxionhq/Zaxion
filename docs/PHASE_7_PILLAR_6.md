# Phase 7: Pillar 6 — Canonical Governance Policies (The Constitution)

## **1. Purpose**
This pillar defines the core set of governance policies that transform Zaxion from a tool into a constitutional framework. These policies address the primary risks of enterprise software development: regressions, security leaks, unauthorized access, and loss of human accountability.

---

## **2. Core Governance Policies**

### **1️⃣ Test Coverage Policy (Coverage)**
*   **Purpose**: Prevent untested code from entering main branches.
*   **Rule**: Requires a minimum number of test files to be added or modified.
*   **Default Config**: `min_tests = 1`
*   **Evaluation Input**: Changed files + test directory diff.
*   **Status**: `BLOCK` if requirement not met.
*   **Why Mandatory**: Untested code is the #1 source of regressions.

### **2️⃣ High-Risk File Change Policy**
*   **Purpose**: Protect sensitive system boundaries.
*   **Rule**: Any change to critical paths requires extra scrutiny.
*   **Protected Paths**: `/auth`, `/security`, `/infra`, `/ci`, `/db/migrations`.
*   **Condition**: Change detected without specific approval.
*   **Status**: `BLOCK`
*   **Why Mandatory**: These files can break or compromise the system instantly.

### **3️⃣ CI Status Integrity Policy**
*   **Purpose**: Ensure CI truth cannot be bypassed.
*   **Rule**: All required CI checks must pass.
*   **Condition**: Missing, skipped, or failed check.
*   **Status**: `BLOCK`
*   **Why Mandatory**: Green CI is the minimum bar for trust.

### **4️⃣ Secret Exposure Detection Policy**
*   **Purpose**: Prevent credential leaks.
*   **Rule**: Scan diffs for secrets (tokens, keys, certs).
*   **Signals**: Entropy detection + regex patterns.
*   **Status**: `BLOCK`
*   **Why Mandatory**: One leaked key can cause catastrophic damage.

### **5️⃣ Large Diff / Blast Radius Policy**
*   **Purpose**: Flag dangerous large changes.
*   **Rule**: PR exceeds line/file change thresholds.
*   **Default Thresholds**: `>500 LOC` or `>20 files`.
*   **Status**: `WARN` (upgradeable to `BLOCK`).
*   **Why Mandatory**: Large PRs hide bugs and bypass review.

### **6️⃣ Dependency Risk Policy**
*   **Purpose**: Prevent vulnerable dependencies.
*   **Rule**: New dependency added with known vulnerabilities.
*   **Signal Source**: Lockfile diff + vulnerability DB.
*   **Status**: `BLOCK`
*   **Why Mandatory**: Supply-chain attacks are common.

### **7️⃣ Reviewer Coverage Policy**
*   **Purpose**: Enforce human accountability.
*   **Rule**: Minimum reviewers required.
*   **Default**: `min_reviewers = 1`
*   **Condition**: Self-approval or missing review.
*   **Status**: `BLOCK`
*   **Why Mandatory**: No human review = silent failure.

### **8️⃣ Ownership Boundary Policy**
*   **Purpose**: Enforce code ownership.
*   **Rule**: Code owners must review owned files.
*   **Signal**: `CODEOWNERS` + diff.
*   **Status**: `BLOCK`
*   **Why Mandatory**: Prevents unauthorized changes.

### **9️⃣ Risk Escalation Policy**
*   **Purpose**: Escalate combined risks.
*   **Rule**: Multiple `WARNs` → `BLOCK`.
*   **Default**: `>=2 WARN → BLOCK`.
*   **Status**: `BLOCK`
*   **Why Mandatory**: Death by a thousand cuts prevention.

### **🔟 Override Accountability Policy**
*   **Purpose**: Prevent silent overrides.
*   **Rule**: Overrides require justification.
*   **Audit Trail**: User, reason, timestamp.
*   **Status**: `BLOCK` override without reason.
*   **Why Mandatory**: Overrides are dangerous without traceability.

---

## **3. Implementation Invariants**
1.  **Deterministic Evaluation**: Every policy must produce a repeatable result based on the `FactSnapshot`.
2.  **Versioned Policies**: Any change to a policy rule or threshold must trigger a new policy version ID.
3.  **Handoff Purity**: Verdicts from these policies must be reported to the Handoff Layer (Phase 5) without modification.
4.  **Remediation Mapping**: Every policy violation must map to a specific remediation hint in Pillar 7.2.

---

## **4. Outcome Goals**
*   **Hardened Main Branches**: Only code that meets the "Constitutional" bar can be merged.
*   **Zero-Trust CI**: Every PR is treated as a potential risk until all 10 policies are satisfied.
*   **Auditable Governance**: A complete history of policy satisfaction for every merge in the system history.
