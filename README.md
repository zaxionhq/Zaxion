# 🏛️ Zaxion: The Enterprise PR Governor

[![Status](https://img.shields.io/badge/Status-Phase_5_Completed-success)](docs/PHASE_5_LOCK.md)
[![License](https://img.shields.io/badge/License-Enterprise_SaaS-blue)](LICENSE)

**Zaxion** is an AI-powered GitHub Test Case Generator that has evolved into a comprehensive **Enterprise PR Governance System**. It ensures that high-risk code never reaches production without the required testing, security audits, and policy compliance.

---

## 🌟 The Core Mission
**"From Assistant to Governor."** Zaxion doesn't just help you write tests; it enforces your organization's quality standards through deterministic PR gates.

---

## 🚀 Quick Links
- **[Teach Me](Teachme.md)**: Learn the philosophy and architecture of Zaxion.
- **[Product Spec](PRODUCT_SPEC.md)**: Why we built this and where we are going.
- **[Developer Guide](dev.md)**: In-depth technical documentation for contributors.
- **[Architecture](docs/ARCHITECTURE.md)**: High-level system design.
- **[Shortcomings](docs/LIMITATIONS_AND_SHORTCOMINGS.md)**: Known boundaries and technical limitations.

---

## 🛠️ Project Structure & Roles

| Directory | Role | Primary Technologies |
| :--- | :--- | :--- |
| **[`/backend`](backend/README.md)** | **The Engine (The Judge)** | Node.js, Express, Sequelize, Redis, BullMQ |
| **[`/frontend`](frontend/README.md)** | **The Command Center** | React, Vite, Tailwind CSS, shadcn/ui |
| **[`/docs`](docs/)** | **The Constitution** | Design locks, Phase specifications, Invariants |

---

## 🏛️ Governance Architecture (Phase 5)

Zaxion operates on five decoupled pillars to ensure absolute trust:

1. **Fact Ingestion**: Deterministic extraction of PR metadata and code changes.
2. **Policy Resolution**: Hierarchical binding of Organization and Repository rules.
3. **Evaluation Engine**: A pure, stateless function that issues `PASS/BLOCK/WARN` verdicts.
4. **Human Accountability**: Cryptographically signed overrides for exceptional cases.
5. **Decision Handoff**: Immutable recording of verdicts before reporting to GitHub.

---

## 🏃 Getting Started

### 📋 Prerequisites
- **Node.js**: v18+
- **PostgreSQL**: v14+ (Storage for Laws, Facts, and Decisions)
- **Redis**: v6+ (Asynchronous PR processing)
- **GitHub App**: Configured with Webhook and Private Key.

### ⚡ Installation
```bash
# 1. Clone the repo
git clone https://github.com/your-repo/zaxion.git
cd zaxion

# 2. Setup Backend
cd backend && npm install && cp .env.example .env

# 3. Setup Frontend
cd ../frontend && npm install && cp .env.example .env

# 4. Run Migrations
cd ../backend && npm run db:migrate
```

### 🏁 Running the System
```bash
# Terminal 1: API Server
cd backend && npm run dev

# Terminal 2: PR Worker (The Processor)
cd backend && node src/workers/prAnalysis.worker.js

# Terminal 3: UI Dashboard
cd frontend && npm run dev
```

---

## 🛡️ Security & Privacy
- **Transient Access**: Source code is processed in-memory and never stored permanently.
- **Immutable Truth**: Every decision is bound to a specific commit and policy version.
- **Deterministic Gates**: We never use AI to decide if a PR should be blocked; we only use AI to help you fix it.

---

## 📈 Current State: Phase 5 Completed
We have successfully implemented the **Decision Producer**. Zaxion is now capable of issuing binding verdicts on GitHub PRs based on deterministic organizational policies.

*Next: Phase 6 — Integration Surface & Ecosystem Hooks.*
