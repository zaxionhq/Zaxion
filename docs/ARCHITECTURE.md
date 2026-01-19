# 🏗️ How It Works (Architecture)

The GitHub Test Case Generator is built as a distributed, event-driven system designed for high availability and enterprise-grade security.

---

## 🛰️ System Overview
The system follows a **Producer-Consumer** pattern to handle high volumes of GitHub webhooks without blocking the API.

1. **GitHub App**: Acts as the entry point, sending webhooks for PR events.
2. **Backend API**: Authenticates webhooks, persists metadata, and queues tasks.
3. **Redis Queue**: Buffers PR analysis tasks for asynchronous processing.
4. **Worker Service**: The "brain" of the system. Analyzes code diffs, evaluates policies, and calls AI services.
5. **PostgreSQL**: Stores the audit trail, user configurations, and policy decisions.

---

## 🛠️ Component Breakdown

### 1. Webhook Handler (`src/controllers/webhook.controller.js`)
- **Security**: Verifies `X-Hub-Signature-256` using HMAC-SHA256.
- **Fail-Safe**: If Redis is down, it executes the analysis synchronously (Direct Execution) to ensure PRs are never ignored.

### 2. PR Analysis Service (`src/services/prAnalysis.service.js`)
- **Immutability**: Once a decision is made for a specific Commit SHA, it is locked in the database with a `policy_version`.
- **Race Condition Protection**: Uses DB-level uniqueness constraints and "Insert-or-Fetch" logic to handle simultaneous webhooks for the same PR.

### 3. Policy Engine (`src/services/policyEngine.service.js`)
- **Deterministic Rules**: Evaluates PRs against configured rules (e.g., Risk-based, Size-based).
- **Versioning**: Every decision is tagged with a `policy_version` (e.g., `v1.0.0`). If the engine is updated, old decisions remain immutable for audit integrity.

### 4. GitHub App Service (`src/services/githubApp.service.js`)
- **Authentication**: Uses JWT for App-level auth and Installation Tokens for repository-level actions.
- **Reporting**: Posts results back to GitHub using **Check Runs** and **PR Comments**.

### 5. Frontend Resolution Architecture (`frontend/src/pages/`)
- **Landing Page (`/`)**: Marketing authority that explains the Zaxion Guard model.
- **Resolution Workspace (`/resolution/:decisionId`)**: Context-aware environment that auto-loads decision facts and repo context for rapid fix generation.
- **Experimental Lab (`/_experimental`)**: Quarantined IDE UI for internal testing and advanced exploration.

---

## 🔄 Data Flow
1. **Event**: User opens/updates a Pull Request.
2. **Webhook**: GitHub sends a `pull_request` event to the Backend.
3. **Queue**: Backend validates the signature and pushes the job to BullMQ (Redis).
4. **Analysis**: Worker pulls the job, fetches the PR diff from GitHub, and runs it through the Policy Engine.
5. **Decision**: The engine decides: `PASS`, `WARN`, or `BLOCK`.
6. **Persistence**: The decision is saved to PostgreSQL with a `started_at` timestamp to prevent "limbo" states.
7. **Feedback**: The result is sent back to the PR via a GitHub Check Run.

---

## 🔒 Security Model
- **At Rest**: All GitHub tokens are encrypted.
- **In Transit**: Mandatory TLS for all API and Webhook communication.
- **Immutability**: Database constraints prevent `policy_version` or `commit_sha` from being updated once a decision is finalized.
