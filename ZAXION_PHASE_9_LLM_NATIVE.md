# 🛡️ Zaxion Phase 9: The LLM-Native Policy Engine

This document outlines the architectural shift from a Deterministic AST-first engine to a **Context-Aware LLM-Native Review Engine**, achieving parity with state-of-the-art tools like OpenAI Codex and Claude Code.

## **Executive Summary**
Currently, Zaxion uses rigid JSON/AST rules to find violations and uses LLMs only as an afterthought (the Refiner layer). Phase 9 flips this paradigm: **The LLM becomes the primary evaluation engine**, guided by the AST and Repository Context (RAG), allowing for natural language policies and human-level architectural reasoning.

---

## **Pillar 1: LLM-First Evaluation Pipeline (`llmEvaluator.service.js`)**

### **The Current Problem**
Rules are hardcoded in JavaScript (e.g., `_checkNoMagicNumbers`). Adding a new, complex enterprise rule (e.g., "All React components must use `useMemo` for heavy calculations") requires backend engineering.

### **The Solution**
We will introduce an `LlmEvaluatorService` that sits alongside the deterministic `EvaluationEngine`. 
- When a policy has `type: "natural_language"`, the system bypasses the AST checkers.
- Instead, it feeds the PR diff, the AST `semanticFacts`, and the plain-text policy description directly to the LLM (Claude/Nvidia/Gemini).
- The LLM acts as the Judge, returning a structured JSON response (Verdict, Violations, Line Numbers, Rationale).

### **Implementation Details**
- **New Policy Type**: Add `natural_language` to `policyMapper.js` and the database schema.
- **Prompt Engineering**: Develop a rigid system prompt that forces the LLM to output predictable, parseable JSON matching the exact schema expected by the Zaxion UI (`{ rule_id, severity, message, file, line, expected, actual }`).
- **Hybrid Mode**: Allow policies to run both Deterministic (for speed/security like secret scanning) and LLM-Native (for architectural vibe checks) simultaneously.

---

## **Pillar 2: Context Window Expansion (Repo-Wide RAG)**

### **The Current Problem**
Zaxion only "sees" the files modified in the Pull Request. It is blind to the rest of the repository, meaning it cannot detect breaking API changes or cross-file data flow issues.

### **The Solution**
Implement a **Retrieval-Augmented Generation (RAG)** system to give the LLM "Project-Wide Eyes."

### **Implementation Details**
- **Vector Database**: Integrate a lightweight, local vector store (e.g., ChromaDB, Qdrant, or even a local Redis/Postgres pgvector setup) into the backend architecture.
- **Background Indexing**: Create a background worker that runs when Zaxion is installed on a repo. It will chunk all files, embed them using an embedding model, and store them in the Vector DB.
- **Dynamic Retrieval**: During PR analysis, `prAnalysis.service.js` will extract the names of modified functions/classes. It will query the Vector DB to find all *other* files in the repo that use those functions.
- **Enriched LLM Context**: These retrieved dependency files will be injected into the LLM's prompt, allowing it to say: *"You changed `getUser()` in `auth.ts`, but you forgot to update `dashboard.tsx` which still expects the old signature."*

---

## **Pillar 3: The Agentic Sandbox (Self-Correcting Patches)**

### **The Current Problem**
Phase 8 introduced `PatchGeneratorService`, but it relies on "blind hope" that the LLM wrote syntactically correct code. If the LLM hallucinates a missing bracket, Zaxion suggests broken code.

### **The Solution**
Integrate an **Execution Sandbox** (e.g., E2B or Docker-based execution) to verify patches *before* showing them to the user.

### **Implementation Details**
- **Sandbox Integration**: When `PatchGeneratorService` creates a git patch, Zaxion spins up an isolated sandbox.
- **Apply & Test**: The sandbox applies the patch and runs the project's linter/tests (e.g., `npm run lint` or `npm test`).
- **The Agentic Loop**: 
  - If the tests **Pass**: The patch is saved and presented to the user in the UI.
  - If the tests **Fail**: The sandbox captures the terminal error (e.g., `SyntaxError: Unexpected token`). Zaxion feeds this error back to the LLM: *"Your patch failed with this error. Fix it."* (Max 3 retries).
- **Fallback**: If the LLM cannot generate a working patch after 3 tries, Zaxion downgrades to providing a "Remediation Description" instead of a broken code patch.

---

## **Pillar 4: Dynamic Rule Translation (The Auto-Coder)**

### **The Current Problem**
LLM evaluations (Pillar 1) are slow and expensive. Running an LLM on every file for every PR does not scale for Enterprise repositories.

### **The Solution**
**"Compile" English to Code**. When an admin writes a natural language policy, Zaxion uses the LLM *once* to generate a deterministic JavaScript AST checker for that specific rule.

### **Implementation Details**
- **Policy Compilation**: When a user saves a `natural_language` policy in the UI, a new backend service (`PolicyCompilerService`) prompts the LLM to write a custom Babel AST traversal function.
- **Dynamic Execution**: This generated JS function is safely stored and executed dynamically (using Node's `vm` module or a safe eval environment) during PR reviews.
- **Result**: The user gets the flexibility of plain-English rules, but Zaxion maintains the sub-second evaluation speed and zero-cost scaling of deterministic execution.

---

## **Migration & Rollout Strategy**

1. **Phase 9.1**: Implement `LlmEvaluatorService` and the `natural_language` policy type (Pillar 1). This is the fastest way to get Claude-level reasoning into the pipeline.
2. **Phase 9.2**: Build the Vector DB integration and background repository indexer (Pillar 2).
3. **Phase 9.3**: Integrate the Sandbox for Agentic Patch Testing (Pillar 3).
4. **Phase 9.4**: Build the `PolicyCompilerService` to optimize performance (Pillar 4).

*No existing workflows will be disrupted. All Phase 8 deterministic policies will remain as "Core Security Policies," ensuring Zaxion retains its baseline reliability while gaining new AI superpowers.*