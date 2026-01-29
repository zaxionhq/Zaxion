# ⚠️ Zaxion: Operational Boundaries & Shortcomings

This document outlines the current limitations and known shortcomings of the Zaxion Enterprise PR Governor. Understanding these boundaries is critical for security and compliance teams relying on Zaxion for production safety.

---

## 1. Contextual Limitations

### 🚫 No Local Git Enforcement
Zaxion is a **GitHub-native** governance system. It does **not** support:
- Local git hooks (e.g., `pre-commit`, `pre-push`).
- Local merges (`git merge`) performed on a developer's machine.
- Direct pushes to protected branches if GitHub branch protection is not strictly configured to require Zaxion's status check.

### 🚫 Non-GitHub Support
Zaxion currently has no integration for:
- GitLab
- Bitbucket
- Azure DevOps
- Self-hosted Git solutions (unless they mimic the GitHub API/Webhook spec).

---

## 2. Technical Shortcomings

### 📉 Large Diff Handling
- **Truncation Risk**: Extremely large Pull Requests (e.g., > 10MB diffs or thousands of files) may encounter GitHub API limits or worker memory constraints. 
- **Fact Ingestion**: The [Fact Ingestor](file:///c:/Users/hamza/OneDrive/Desktop/hamza/github-testcase-generator-app/backend/src/services/factIngestor.service.js) may skip files in "truncated" trees if the repository structure is excessively deep or broad.

### 🧩 Language & AST Support
- While Zaxion is designed to be language-agnostic in its governance logic, its "Deep Analysis" capabilities (like automated test generation) are currently optimized for **JavaScript/TypeScript** and **Python**.
- Languages with complex build-time dependencies or proprietary formats may have reduced "Fact" accuracy.

### ⏳ Latency in "PR Storms"
- Zaxion uses an asynchronous [PR Worker](file:///c:/Users/hamza/OneDrive/Desktop/hamza/github-testcase-generator-app/backend/src/workers/prAnalysis.worker.js) queue.
- During high-load periods ("PR Storms"), there may be a delay between a PR update and the Zaxion verdict appearing on GitHub. This is a trade-off for the system's "Fail Closed" security posture.

---

## 3. Governance Gaps

### 🛡️ "Fail Closed" vs. Developer Velocity
- Zaxion's primary invariant is **Safety > Speed**. If the Zaxion service is down, PRs remain blocked. 
- This can create a single point of failure for an organization's deployment pipeline if not managed with high-availability infrastructure.

### 👤 Human-in-the-loop Requirement
- Zaxion is a **Governor**, not an **Autopilot**. It identifies violations but requires humans to sign [Overrides](file:///c:/Users/hamza/OneDrive/Desktop/hamza/github-testcase-generator-app/backend/src/services/overrides.service.js) or fix the code.
- It cannot "automatically" fix complex logic violations without human intervention.

---

## 4. Mitigation Strategies

To address these shortcomings, we recommend:
1. **GitHub Branch Protection**: Always enable "Require status checks to pass before merging" for the Zaxion check run.
2. **HA Deployment**: Run Zaxion in a high-availability cluster (Kubernetes/ECS) with redundant Redis/Postgres instances.
3. **Rollout Modes**: Use `OBSERVE_ONLY` mode during initial deployment to identify performance bottlenecks without blocking developers.
