# Phase 7: Pillar 6 — Canonical Governance Policies (The Constitution)

## **1. Purpose**
This pillar defines the core set of governance policies that transform Zaxion from a tool into a constitutional framework. These policies address the primary risks of enterprise software development: regressions, security leaks, unauthorized access, and loss of human accountability.

---

## **2. Core Governance Policies**

### **1️⃣ CI Status Integrity Policy**
*   **Purpose**: Ensure CI truth cannot be bypassed.
*   **Rule**: All required CI checks must pass.
*   **Condition**: Missing, skipped, or failed check.
*   **Status**: `BLOCK`
*   **Why Mandatory**: Green CI is the minimum bar for trust.

### **2️⃣ Secret Exposure Detection Policy**
*   **Purpose**: Prevent credential leaks.
*   **Rule**: Scan diffs for secrets (tokens, keys, certs).
*   **Signals**: Entropy detection + regex patterns.
*   **Status**: `BLOCK`
*   **Why Mandatory**: One leaked key can cause catastrophic damage.

### **3️⃣ Dependency Risk Policy**
*   **Purpose**: Prevent vulnerable dependencies.
*   **Rule**: New dependency added with known vulnerabilities.
*   **Signal Source**: Lockfile diff + vulnerability DB.
*   **Status**: `BLOCK`
*   **Why Mandatory**: Supply-chain attacks are common.

### **4️⃣ Reviewer Coverage Policy**
*   **Purpose**: Enforce human accountability.
*   **Rule**: Minimum reviewers required.
*   **Default**: `min_reviewers = 1`
*   **Condition**: Self-approval or missing review.
*   **Status**: `BLOCK`
*   **Why Mandatory**: No human review = silent failure.

### **5️⃣ Ownership Boundary Policy**
*   **Purpose**: Enforce code ownership.
*   **Rule**: Code owners must review owned files.
*   **Signal**: `CODEOWNERS` + diff.
*   **Status**: `BLOCK`
*   **Why Mandatory**: Prevents unauthorized changes.

### **6️⃣ Risk Escalation Policy**
*   **Purpose**: Escalate combined risks.
*   **Rule**: Multiple `WARNs` → `BLOCK`.
*   **Default**: `>=2 WARN → BLOCK`.
*   **Status**: `BLOCK`
*   **Why Mandatory**: Death by a thousand cuts prevention.

### **7️⃣ Override Accountability Policy**
*   **Purpose**: Prevent silent overrides.
*   **Rule**: Overrides require justification.
*   **Audit Trail**: User, reason, timestamp.
*   **Status**: `BLOCK` override without reason.
*   **Why Mandatory**: Overrides are dangerous without traceability.

### **8️⃣ License Compliance Policy**
*   **Purpose**: Protect intellectual property.
*   **Rule**: Block forbidden or restrictive open-source licenses.
*   **Signal**: `package.json` / `requirements.txt` / `Gemfile` scan.
*   **Status**: `BLOCK`
*   **Why Mandatory**: Legal risk from incompatible licenses is an enterprise showstopper.

### **9️⃣ Branch Protection Alignment Policy**
*   **Purpose**: Enforce release hygiene.
*   **Rule**: PR target branch must align with the environment strategy.
*   **Condition**: PR directly to `main` from an unauthorized fork or feature branch.
*   **Status**: `BLOCK`
*   **Why Mandatory**: Prevents accidental deployments and "cowboy coding" on stable branches.

### **🔟 Commit Message Standard Policy**
*   **Purpose**: Ensure audit trail readability.
*   **Rule**: Commits must follow the Conventional Commits specification.
*   **Pattern**: `type(scope): description`
*   **Status**: `WARN` (upgradeable to `BLOCK`).
*   **Why Mandatory**: Semantic commit messages are essential for automated changelog generation and root-cause analysis.

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
