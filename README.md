# GitHub Test Case Generator (Enterprise SaaS)

[![Status](https://img.shields.io/badge/Status-Phase_2_Development-blue.svg)](https://github.com/your-repo)
[![Backend](https://img.shields.io/badge/Backend-Node.js_Express-green.svg)](https://expressjs.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React_Vite-61dafb.svg)](https://vitejs.dev/)

**An AI-powered PR Gatekeeper and Test Generation engine built for enterprise software teams.**

The GitHub Test Case Generator doesn't just write tests—it enforces quality. By integrating directly into your GitHub Pull Request workflow, it analyzes code changes, identifies high-risk areas, and ensures that critical logic (auth, payments, config) is never merged without adequate test coverage.

---

## ✨ Key Features

### 🛡️ PR Gatekeeping (Phase 1)
- **Deterministic Analysis**: Instantly detects which files changed and identifies missing tests.
- **Fail-Safe Architecture**: Built-in resilience with Direct Execution fallbacks and Redis-backed queues.
- **GitHub-Native**: Communicates directly via PR comments and Status Checks—no need to leave GitHub.

### ⚙️ Policy Engine (Phase 2 - In Progress)
- **Risk-Based Enforcement**: Automatically flags changes to `auth/`, `payment/`, and `.env` files.
- **PR Size Guardrails**: Prevents "mega-PRs" by warning developers when changes are too large to review effectively.
- **Context-Aware Rules**: Strict enforcement on `main` branch with flexible warnings for feature branches.

### 🤖 AI Test Generation (Coming Soon)
- **Context-Aware Tests**: Uses LLMs to generate meaningful unit and integration tests.
- **AST Parsing**: Deep understanding of your code structure for accurate test assertions.

---

## 🛠️ Technology Stack

### Backend
- **Node.js (Express)**: Scalable, service-oriented architecture.
- **PostgreSQL (Sequelize)**: Reliable persistence for audit logs and policies.
- **Redis (Upstash)**: Distributed queueing for asynchronous PR analysis.
- **GitHub API**: Secure integration using GitHub Apps and HMAC verification.

### Frontend
- **React (Vite)**: Modern, high-performance UI.
- **Tailwind CSS & shadcn/ui**: Clean, accessible, and professional design system.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Redis Instance (or Upstash account)
- GitHub Fine-grained PAT (or GitHub App credentials)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/github-testcase-generator.git
   ```
2. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install
   # Frontend
   cd ../frontend && npm install
   ```
3. Configure environment variables (see `backend/.env.example`).
4. Start the development servers:
   ```bash
   # In backend/
   npm run dev
   # In frontend/
   npm run dev
   ```

---

## 🤝 Contributing
This is an enterprise-focused project. Please ensure all contributions include:
- Meaningful unit/integration tests.
- Proper error handling and logging.
- Compliance with the architectural patterns defined in the [PRODUCT_SPEC.md](./PRODUCT_SPEC.md).

---

## 🎯 Our Mission
To eliminate the friction of software testing by providing developers with automated tools that ensure quality, security, and speed at scale.
