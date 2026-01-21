# Zaxion PR Gate (The Core Concept)

## 1. Introduction
The PR Gate is the entry point of the Zaxion system. It acts as a guardian between code changes and your production environment.

## 2. How it Works
1.  **Webhook Trigger:** GitHub sends a `pull_request` event to the Zaxion backend.
2.  **Analysis:** The Zaxion Worker fetches the diff and analyzes the risk surface using AST parsing.
3.  **Evaluation:** The Policy Engine compares the changes against the current Policy Version.
4.  **Status Check:** Zaxion posts a Check Run back to GitHub:
    *   ✅ **PASS:** Merge is allowed.
    *   ⚠️ **WARN:** Merge is allowed but issues are flagged.
    *   ❌ **BLOCK:** Merge is prevented until resolved or overridden.

## 3. Why a Gate?
Unlike traditional CI, a Gate focuses on **intent and governance**. It ensures that high-risk areas (like `auth`, `payments`, or `config`) have documented verification before they reach your main branch.
