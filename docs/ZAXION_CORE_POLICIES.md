# Zaxion Core Policy Library (Standard Invariants)
**Status:** In Progress (Derived from Phase 7 Research)
**Objective:** Provide out-of-the-box governance for high-stakes software engineering.

---

## **1. Security Invariants (SEC)**

### **SEC-FS-01: Filesystem Path Sanitization**
- **Derived from:** [Aden PR #5635](https://github.com/aden-hive/hive/pull/5635)
- **Constraint:** All filesystem access must be resolved via `realpath` (or equivalent) before permission checks.
- **AST Pattern:** `os.path.abspath` -> `os.path.realpath` logic flow required for all `os.path` inputs.
- **Value:** Prevents Symlink-based sandbox escapes.

### **SEC-GUARD-04: Secret Data Integrity**
- **Derived from:** [OpenHands PR #12722](https://github.com/All-Hands-AI/OpenHands/pull/12722)
- **Constraint:** Objects identified as 'Secret' or 'Credential' must have an explicit non-null validation before persistence or network calls.
- **AST Pattern:** Trace `Secret` object creation to ensure `if obj is not None` exists in the call path.
- **Value:** Prevents "Null-Leak" security gaps and downstream crashes.

---

## **2. Architecture Invariants (ARCH)**

### **ARCH-OS-01: Cross-Platform Implementation Parity**
- **Derived from:** [Ollama PR #11508](https://github.com/ollama/ollama/pull/11508)
- **Constraint:** Performance kernels or OS-specific logic must have equivalent implementations or safe fallbacks for all supported operating systems.
- **AST Pattern:** Check `#ifdef` or `runtime.GOOS` blocks for corresponding implementations in the same module.
- **Value:** Prevents platform-specific performance degradation and "Missing Symbol" errors.

---

## **3. Safety Invariants (SAFE)**

### **SAFE-INFRA-01: Infinite Recursion Guard**
- **Derived from:** [Union PR #4778](https://github.com/unionlabs/union/pull/4778)
- **Constraint:** Methods must not contain direct self-recursive calls without an explicit exit branch (base case) identified in the AST.
- **AST Pattern:** Static Call Graph analysis to identify cycles within the same scope.
- **Value:** Prevents runtime stack overflow panics and node instability.

---

## **How to use this Library**
These policies are automatically active for projects using the **"Zaxion Default Profile."** Users can override specific rules or add their own custom policies in their `zaxion.yaml` configuration.

---
**Version:** 1.0.0-alpha
**Last Updated:** 2026-03-04
