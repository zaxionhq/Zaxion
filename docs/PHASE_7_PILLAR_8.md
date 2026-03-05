# Phase 7: Pillar 8 — The Zaxion Simulation Engine & Test Harness (The Sandbox)

## **1. Purpose**
Before a user commits a new policy to their repository or organization, they must be able to verify its impact. The **Zaxion Simulation Engine** provides a risk-free "Sandbox" where users can test custom policies against historical PR data to prevent accidental "PR Storms" or false-positive blocks.

---

## **2. Core Capabilities**

### **A. Historical Back-Testing (Shadow Execution)**
*   **Capability**: Run a new or modified policy against the last 50-100 PRs in a repository's history.
*   **Outcome**: Generate a "Shadow Report" showing exactly which historical PRs would have been blocked if the policy had been active.
*   **Value**: Allows admins to fine-tune thresholds (e.g., test coverage percentages) before enforcing them on the team.

### **B. Policy Playground (Interactive Testing)**
*   **Capability**: A UI-based editor where users can paste a diff and write a custom policy (YAML/Logic) to see the verdict in real-time.
*   **Simulation Invariant**: Playback is strictly read-only. No GitHub statuses are sent, and no permanent governance records are created.

### **C. Regression Suite (The Harness)**
*   **Capability**: A library of "Golden Test Cases" (e.g., known good code vs. known risky code) that every policy must pass before it can be promoted to `ENFORCE` mode.
*   **Automatic Verification**: If a policy change causes a "Golden Case" to fail (e.g., it blocks a standard bug fix), Zaxion prevents the policy update.

---

## **3. Key Invariants**

1.  **Isolation Boundary**: Simulations must run in a "Shadow Environment." They share the AST Parser logic but use a transient database that is wiped after the simulation ends.
2.  **No Side-Effects**: A simulation is strictly forbidden from triggering Slack alerts, Jira tickets, or GitHub Check updates.
3.  **Fact-Consistency**: The simulation must use the exact `FactSnapshot` stored in the history to ensure the test is 100% accurate to what happened in the past.
4.  **Policy Promotion Gate**: A policy cannot be moved from `OBSERVE_ONLY` to `ENFORCE` unless it has passed a mandatory simulation run with a "Stability Score" > 95%.

---

## **4. The Simulation Workflow**

1.  **Draft**: User writes a new custom policy in the Zaxion Console.
2.  **Select Context**: User chooses "Repo-Alpha" and "Last 30 Days" as the test data.
3.  **Simulate**: Zaxion runs the draft policy against every historical `FactSnapshot`.
4.  **Review**: User sees a "Risk Impact Report":
    *   *Total PRs Analyzed: 140*
    *   *Simulated Blocks: 12*
    *   *Agreement with Human Review: 92%*
5.  **Promote**: User is confident and moves the policy to `WARN_ONLY` or `ENFORCE`.

---

## **5. Outcome Goals**
*   **Zero-Friction Adoption**: Admins are confident that new rules won't break the developer's day.
*   **High-Fidelity Policies**: Custom rules are battle-tested against real history before they go live.
*   **Developer Trust**: When Zaxion blocks a PR, the developer knows the policy was already "simulated" and proven to be accurate.

---
**Zaxion: Build Fast. Simulate First. Govern Autonomously.**
