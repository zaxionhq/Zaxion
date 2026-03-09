# Zaxion: Technical Overview

This document provides a comprehensive technical breakdown of the Zaxion protocol. It explains the core problem Zaxion solves, the current platform capabilities, and the underlying architecture that powers autonomous Pull Request governance.

---

## 0. Executive Summary

- **Problem** – As engineering teams scale, code reviews often become a bottleneck or lose consistency. Senior engineers frequently police repetitive rules (tests, security, architecture) manually instead of focusing on high-level design. Architectural standards often exist only in static documentation, not as active guards in the CI/CD pipeline.
- **Solution** – Zaxion is an **autonomous governance protocol** that integrates directly with GitHub. It encodes engineering standards as machine-executable policies, then **evaluates every Pull Request deterministically** against those policies before they can be merged.
- **Developer Experience** – To a developer, Zaxion provides immediate feedback via GitHub checks and a comprehensive Governance Dashboard. Every PR receives a clear PASS/BLOCK verdict with actionable remediation steps.
- **Current State** – Zaxion features a production-grade backend (PR ingestion, policy resolution, deterministic evaluation engine, immutable audit log) and a full React-based management interface.

### **2. Multi-Model AI Orchestration**
Unlike standard static analysis tools, Zaxion utilizes a **Multi-Model AI Orchestration** layer to provide context-aware governance and remediation.
- **Claude 3.5 Sonnet** — Primary engine for complex architectural reasoning and code generation.
- **NVIDIA / Llama 3.1 405B** — High-performance engine for deep logic analysis and security vulnerability assessment.
- **Google Gemini 1.5 Flash** — Fast, low-latency engine for rapid PR summarization and initial fact triage.

By decoupling the governance logic (The Judge) from the explanation layer (The Advisor), Zaxion ensures that while the **Verdict** is deterministic, the **Guidance** is sophisticated and human-readable.

---

## 3. The Core Governance Problem

Every high-growth engineering organization establishes standards such as:

- “All authentication and payment logic must have 100% test coverage.”  
- “Infrastructure-as-Code changes require a specific approval workflow.”  
- “Zero tolerance for hard-coded secrets or unsafe execution patterns.” 
- Zaxion has his own set of policies that are encoded as machine-executable rules.
- Zaxion has his own Policy Library that contains all the policies that Zaxion can enforce.

In practice, these standards face several challenges:

1. **Information Fragmentation** – Best practices live in scattered wikis, onboarding decks, and Slack threads, making them easy to overlook under deadline pressure.  
2. **Reviewer Inconsistency** – Human reviewers are subject to fatigue and varying levels of expertise, leading to "governance drift" where the actual codebase deviates from the intended architecture.  
3. **Audit Oliquity** – When security incidents or architectural failures occur, teams often lack a deterministic record of *why* a specific change was allowed to bypass standard guards.  

Zaxion solves this by transforming human-only processes into a **repeatable, machine-verified system**.

---

## 2. Product Vision and Core Value

Zaxion serves as an **autonomous PR governance layer** for the modern software development lifecycle.

The platform provides a centralized **governance console** featuring:
- **Dashboard** – High-level visibility into institutional trust, override rates, and enforcement impact.
- **Policy Impact Simulator** – A sandbox to evaluate new policies against historical data or arbitrary code before activation.
- **Decisions Console** – A searchable history of verdicts, including policy violations and signed override rationales.
- **Analytics** – Insights into violation hotspots, policy effectiveness, and organizational risk trends.

At its core, Zaxion introduces the **governance decision** as a first-class primitive. For every code change, the system generates an immutable record containing the extracted code facts, the active policy version, the final verdict, and any human justifications for exceptions.

---

## 3. Platform Features

**Governance Dashboard**
- Real-time overview of recent decisions and institutional compliance health.
- Visual tracking of **Enforcement Rate** and **Projected Impact** of pending policy updates.

**Policy Impact Simulator**
- Allows operators to **draft and test policies** to understand their "blast radius" before enforcement.
- Support for multiple input modes:
  - Historical repository data.
  - Direct file/ZIP uploads and code snippets.
  - Active GitHub Pull Request URLs.
- Results provide a detailed breakdown of projected blocks, rationales, and specific line-level violations.

**Decisions & Analytics**
- **Decisions** – A chronological, filterable ledger of every PR verdict, including override history and technical justifications.
- **Analytics** – Surfaces systemic risks, such as frequently triggered security rules or repositories with high architectural debt.

**Documentation & Reference**
- A comprehensive suite of guides covering protocol principles, rule definitions, security models, and implementation strategies.

---

## 4. The Runtime Pipeline

Zaxion operates as a deterministic "court" for every code proposal.

1. **Ingress** – Monitors repository lifecycle events via the Zaxion GitHub App.
2. **Fact Extraction** – Parses the PR diff into **AST-based facts**. This process is entirely static; Zaxion never executes source code.
3. **Policy Resolution** – Determines the applicable policy set (Global, Repository, or Branch) and pins specific versions for the evaluation.
4. **Deterministic Evaluation** – Matches extracted facts against the declarative ruleset. This engine uses formal logic rather than probabilistic scoring to ensure 100% repeatability.
5. **Audit & Publication** – Records the decision in an **immutable ledger** and reports the status back to GitHub.

---

## 5. Policy Model & Rule Definitions

Zaxion policies are designed for precision and auditability.

**Policy Structure**
- Metadata (name, scope, target).
- Versioning (pinned to specific enforcement levels: OBSERVE, WARN, or MANDATORY).

**Rule Logic**
Policies are defined using a structured JSON/YAML schema. Core rule types include:
- `pr_size` – Limits the scope of changes to ensure reviewability.
- `coverage` – Enforces testing requirements on specific paths.
- `file_extension` – Restricts allowed file types in sensitive directories.
- `security_path` – Flags changes to critical infrastructure or security logic.
- `security_patterns` – Detects secrets, unsafe functions, and risky code patterns (Wave 1).
- `code_quality` – Prevents debugging code or non-standard patterns from reaching production (Wave 1).
- `complexity_metrics` – Enforces architectural quality (God objects, monolithic functions, cyclomatic complexity) (Wave 2).
- `dependency_scan` – Checks for known vulnerabilities in dependencies (Wave 3).

---

## 6. Simulation & Blast-Radius Control

Before any policy is enforced, operators use the **Policy Impact Simulator** to prevent workflow disruption.

- **Impact Analysis** – Calculate exactly how many historical or active PRs would be blocked by a new rule.
- **Refinement** – Tweak rule parameters based on simulation results to balance security with developer velocity.
- **Promotion** – Only once a policy is verified is it promoted from a "Draft" to an "Active" version in the runtime pipeline.

---

## 7. Security & Privacy Compliance

Zaxion is architected for high-security environments, emphasizing **zero-retention** and tenant isolation.

- **Zero-Retention Model** – Source code is fetched into volatile memory for analysis and immediately purged once facts are extracted. Zaxion does not store raw source code.
- **Stateless Pipeline** – Every evaluation is isolated, preventing cross-contamination of intellectual property.
- **Immutable Audit Trail** – All governance decisions and overrides are cryptographically signed and stored in a tamper-proof record for compliance auditing.
- **Minimum Permission Scoping** – The Zaxion GitHub App requests only the specific permissions needed to analyze diffs and report check statuses.

---

## 8. Technology Stack

**Backend**
- **Runtime:** Node.js + Express.
- **Persistence:** PostgreSQL (via Sequelize) for metadata and audit records.
- **Integrations:** GitHub App API via Octokit.
- **Infrastructure:** Redis-backed queues for scalable PR ingestion and analysis.

**Frontend**
- **Framework:** React with Vite.
- **Interface:** Modern, responsive UI built with Tailwind CSS and specialized governance components.
- **Documentation:** Integrated Markdown-based documentation system.

---

## 9. Development Evolution

Zaxion has evolved from a simple PR check utility into a comprehensive institutional governance platform.

1. **Phase 1: Foundation** – Development of the core GitHub integration and the deterministic evaluation engine.
2. **Phase 2: Management Layer** – Introduction of the Governance Dashboard and Decision ledger.
3. **Phase 3: Simulation & Impact** – Release of the Policy Impact Simulator to enable data-driven policy creation.
4. **Phase 4: Institutional Grade** – Implementation of the immutable audit trail and advanced security scanning capabilities.
5. **Phase 5: Policy Expansion (Current)** – Implementation of the Top 30 Core Policies across three waves:
    - **Wave 1 (Completed)**: Static Pattern Expansion (Regex & AST) for security and code quality.
    - **Wave 2 (Completed)**: Advanced AST & Control Flow for architectural complexity (God Objects, Cyclomatic Complexity).
    - **Wave 3 (In Progress)**: External & Lifecycle Integration for dependency scanning and configuration analysis.

Today, Zaxion provides a cohesive ecosystem where engineering standards are enforced by code, ensuring that security and architectural integrity are built-in by default.
