# Zaxion: Autonomous PR Governance Infrastructure 🛡️

[![Status](https://img.shields.io/badge/Status-Phase_5_Completed-success)](file:///c:/Users/hamza/OneDrive/Desktop/hamza/Zaxion/docs/PHASE_5_LOCK.md)
[![License](https://img.shields.io/badge/License-Enterprise_SaaS-blue)](file:///c:/Users/hamza/OneDrive/Desktop/hamza/Zaxion/LICENSE)

**Zaxion** is an AI-native governance platform that transforms passive engineering documentation into active code guardrails. By integrating directly into your development workflow, Zaxion ensures that every Pull Request aligns with your organization's non-negotiable architectural and security standards.

---

## �️ What is Zaxion?
Zaxion is an **Autonomous PR Governor**. Unlike standard linters that focus on syntax, Zaxion understands the **context and intent** of code changes. It acts as a "Virtual Senior Engineer" that automatically evaluates every PR against a set of hierarchical policies, issuing binding verdicts to block non-compliant code before it merges.

## 🎯 Who is it for?
- **Engineering Leaders (CTOs/VPs):** Who want to ensure high-level standards are enforced across the entire organization without manual overhead.
- **Open Source Maintainers:** Who need to protect their projects from technical debt and low-quality contributions.
- **Enterprise Security Teams:** Who require automated, deterministic verification of security policies (e.g., "all auth changes must have tests").

## 🛠️ The Problem (Precision)
Modern engineering teams suffer from **"Documentation Drift."**
1. **Passive Knowledge:** Best practices are buried in READMEs or Notion pages that developers forget during a crunch.
2. **Reviewer Fatigue:** Human reviewers miss architectural risks because they are focused on business logic or typos.
3. **Inconsistent Standards:** Different teams or individuals apply rules with varying degrees of strictness, leading to a fragmented and fragile codebase.

**Zaxion solves this by making governance a hard requirement, not a suggestion.**

## �️ High-Level Architecture
Zaxion is built on a decoupled, deterministic architecture to ensure absolute reliability:

1. **Fact Ingestion:** A formal **GitHub App** listens for PR events and extracts metadata/code changes via webhooks.
2. **Analysis Engine:** Utilizes Abstract Syntax Tree (AST) parsing to understand the *logic* of the change, not just the text.
3. **Evaluation Engine:** A stateless, pure function evaluates facts against your repository-specific or organization-wide policies.
4. **Enforcement Layer:** Communicates back to GitHub to block merges or provide instant, educational feedback to the developer.
5. **Security Isolation:** Operates on a **"Fetch-Analyze-Discard"** model. Code is processed in-memory and wiped immediately after a decision is issued.

## ✨ Key Features
- **Deterministic Gates:** We never use AI to "guess" if a PR should be blocked; we use AI only to help developers fix the specific policy violations.
- **Zero-Retention Privacy:** Your intellectual property never stays on our servers.
- **Stateless Authentication:** High-performance **JWT-based identity management** ensures speed and scalability.
- **Portable Policies:** Define your rules as code (YAML/JSON) directly in your repository.

---

## 🚀 How to Use Zaxion

Zaxion is designed to be seamless. You don't need to run any code locally to protect your repositories.

### 1. Install the GitHub App
Visit the [Zaxion GitHub App](https://github.com/apps/zaxion) (replace with your actual app link) and click **Install**. You can choose to install it on all repositories or select specific ones.

### 2. Configure Your Policies
Once installed, log in to the [Zaxion Dashboard](https://zaxion.vercel.app) (replace with your actual production URL) using your GitHub account. From here, you can:
- View your connected repositories.
- Define custom governance policies (e.g., "Require tests for all changes in `src/auth`").
- Monitor the status of active Pull Requests.

### 3. Automated Enforcement
Zaxion will now automatically listen for every Pull Request event in your selected repositories.
- **Evaluation:** It analyzes the code changes against your policies.
- **Verdict:** If a PR violates a policy, Zaxion will block the merge and leave an educational comment explaining how to fix it.
- **Resolution:** Once the developer pushes the required changes, Zaxion re-evaluates and clears the block.

---

## 🛠️ Self-Hosting (Optional)
If you are an enterprise that requires Zaxion to run within your own infrastructure, please refer to our [Self-Hosting Guide](docs/SELF_HOSTING.md) for instructions on setting up the Node.js backend, Redis worker, and PostgreSQL database.

---

## 🛡️ Security & Compliance
- **AES-256 Encryption:** All metadata at rest and in transit is encrypted.
- **Audit Trails:** Every decision is logged in an immutable ledger for compliance auditing.
- **Tenant Isolation:** Strict logical isolation of all organizational data.

---

*Zaxion: Turning engineering standards into the infrastructure that powers your code.*
