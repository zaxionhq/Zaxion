# 📄 Product Specification: GitHub Test Case Generator (Enterprise SaaS)

## 1. Product Overview
The **GitHub Test Case Generator** is an enterprise-grade developer productivity and quality enforcement tool. It integrates directly into the GitHub workflow to analyze code changes, enforce testing policies, and automatically generate high-quality test cases. 

Unlike simple AI wrappers, this system acts as a **PR Gatekeeper**, ensuring that critical code changes are accompanied by tests before they can be merged.

## 2. Purpose & Value Proposition
- **Automated Quality Gates**: Prevent untested "high-risk" code (auth, payments, config) from reaching production.
- **Developer Productivity**: Automatically generate unit and integration tests, saving hours of manual boilerplate.
- **Enterprise Resilience**: Built with fail-safe logic, deterministic policy evaluation, and secure webhook handling.
- **Seamless Workflow**: Works entirely within GitHub (PR comments, Check Runs) without requiring a separate dashboard for every action.

## 3. Target Users
- **Enterprise Engineering Teams**: Standardize testing requirements across hundreds of repositories.
- **DevOps/Platform Engineers**: Enforce compliance and quality standards at the organizational level.
- **Individual Developers**: Rapidly increase test coverage with AI assistance.

## 4. Key Features & Roadmap

### ✅ Phase 1: PR Gate Core (Completed)
- **Deterministic PR Analysis**: Analyzes PR diffs to identify changed files and test coverage.
- **Fail-Safe Webhook Architecture**: Resilient webhook handler with Direct Execution fallback if queues (Redis) are unavailable.
- **GitHub-Native Enforcement**: Uses GitHub API to post results directly to PRs.
- **Secure Integration**: HMAC-SHA256 signature verification and encrypted token management.

### 🚀 Phase 2: Minimal Policy Engine (In Progress)
- **Policy 1: High-Risk Protection**: Automatically blocks/warns if critical files (e.g., `auth/`, `payment/`, `config/`, `.env`) are changed without corresponding test updates.
- **Policy 2: PR Size Control**: Warns developers when a PR exceeds a specific number of changed files to encourage smaller, reviewable changes.
- **Policy 3: Branch-Specific Rules**: Enforces strict "Block" rules on `main`/`production` while allowing "Warn" flexibility on feature branches.
- **Enterprise Logging**: Every policy decision is stored in PostgreSQL for audit trails and compliance.

### 🔮 Future Phases
- **AI-Powered Test Generation**: Intelligent test suite creation using AST-based code understanding.
- **Advanced Coverage Reports**: Visualizing coverage trends across the entire organization.
- **Self-Healing Tests**: AI detects broken tests and suggests fixes based on code changes.

## 5. Technical Architecture
- **Backend**: Node.js (Express) with a service-oriented architecture.
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui.
- **Database**: PostgreSQL (Sequelize ORM) for users, policies, and audit logs.
- **Queueing**: Redis (Upstash) for asynchronous PR processing.
- **Security**: GitHub App integration (moving from PAT), JWT authentication, and HMAC webhook validation.

## 6. Success Metrics
- **Test Coverage %**: Average increase in coverage per repository.
- **PR Cycle Time**: Reduction in time spent writing/reviewing tests.
- **Escaped Defects**: Decrease in bugs reaching production due to missing tests.
- **Compliance Rate**: Percentage of PRs that pass the "High-Risk" policy on the first try.
