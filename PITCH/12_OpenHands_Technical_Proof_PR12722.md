   # Technical Evidence Log: OpenHands PR #12722
   **Project:** [OpenHands](https://github.com/All-Hands-AI/OpenHands)
   **Target:** Graham Neubig (Co-founder)
   **Focus:** Automated Security Invariants & Conversation Integrity

   ---

   ## 1. The Critical Gap (Analysis of PR #12722)
   In PR #12722, a bug was identified where `null` secrets in the conversation JSON were bypassing initial checks and causing validation failures downstream. While the `all-hands-bot` eventually caught the lack of tests, the PR required multiple human-in-the-loop cycles to ensure all edge cases (empty strings vs. nulls) were handled.

   ### **The "Senior Reviewer" Burden:**
   - **Manual Verification:** Reviewers had to check if the filter logic was robust enough for different JSON serialization edge cases.
   - **Bot Noise:** The internal bot provided suggestions, but they were conversational rather than enforcement-based.
   - **Regression Risk:** Without a hard invariant, similar "null-leak" bugs could reappear in other conversation-related modules.

   ---

   ## 2. How Zaxion Prevents This (Deterministic Governance)
   Zaxion would have intercepted this PR at the **Diff Analysis** stage by mapping the changes against a global **Security & Data Integrity Policy**.

   ### **Policy: `SEC-GUARD-04` (Secret Integrity)**
   > "Any object identified as a `Secret` or `Credential` in the AST must be validated for non-nullity before entering the `Validation` or `Persistence` layers."

   ### **Zaxion’s Automated Verdict (Simulated):**
   ```yaml
   [ZAXION-REPORT] PR #12722
   STATUS: BLOCKED (Policy SEC-GUARD-04 Violation)

   ERROR: Found unhandled 'null' potential in Secret filtering logic.
   FILE: openhands/ag_server/utils/conversation_validation.py

   LOGIC-GAP:
   The current filter handles list-level nulls but does not enforce a 
   Schema Invariant for the 'Secret' object structure itself.

   REMEDIATION:
   1. Apply AST-level constraint: Ensure 's.value' is explicitly checked 
      against 'NoneType' before the list comprehension concludes.
   2. Requirement: A unit test matching 'TEST-DATA-INTEGRITY-01' must be 
      present in the same PR to satisfy the Coverage Invariant.
   ```

   ---

   ## 3. Beyond "AI Suggestions": Hard Invariants
   Unlike a standard LLM-based bot that "suggests" fixes, Zaxion treats architectural standards as **Executable Invariants**.

   | Feature | `all-hands-bot` (Current) | Zaxion Governance |
   | :--- | :--- | :--- |
   | **Detection** | Pattern-based suggestions | AST-driven Invariant matching |
   | **Enforcement** | Comment-only | Hard PR Block (Governance Check) |
   | **Rationale** | "Consider adding..." | "Violates Policy SEC-GUARD-04" |
   | **Outcome** | Reviewer must still verify | Guaranteed compliance before human review |

   ---

   ## 4. The Value for OpenHands
   By deploying Zaxion, Graham and the team shift from **Reviewing Code** to **Defining Governance**. 

   1. **Zero-Retention Security:** Zaxion analyzes the conversation logic in-memory. We never store OpenHands' code or secrets.
   2. **Reduced Bot Noise:** Instead of the bot asking for tests, Zaxion blocks the PR until the test invariant is met.
   3. **Architecture Scaling:** As OpenHands grows, Zaxion ensures that every new contributor follows the exact secret-handling protocols defined by the core team.

   ---
   **Verdict:** Zaxion turns "Oops, we forgot to filter nulls" into a physical impossibility within the CI/CD pipeline.
