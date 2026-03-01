# Security & Compliance: Plain English FAQ

## "Does Zaxion store our source code?"
**No.** This is the most common question I get, and the answer is simple: **The system operates on a 'Zero-Retention' model.**

Here’s exactly what happens:
1.  When a PR is opened, the system fetches the specific file changes (diffs) into the server's RAM (memory).
2.  It analyzes them immediately (usually takes less than 2 seconds).
3.  It generates a Pass/Fail decision.
4.  **It wipes the code from memory.**

Zaxion never saves your source code to a database or disk. It only saves the *record* of the decision (e.g., "PR #55 blocked because it violated Policy A").

## "How is our data kept separate?"
If you use the cloud version, your organization is strictly isolated.
*   **Database Isolation:** Every single database query automatically includes your Organization ID. It is physically impossible for Customer A to query Customer B's data.
*   **Encryption:** All sensitive keys (like your GitHub tokens) are encrypted with AES-256 before they ever touch the database.

## "What happens if GitHub goes down?"
Zaxion is built to be resilient. If GitHub's API has a hiccup, the system doesn't just fail. It queues the analysis job and retries it automatically with "exponential backoff" (waiting a bit longer each time). This ensures every PR gets processed, even if the internet is having a bad day.

## "Can auditors see what happened?"
**Yes.** This is a huge feature for regulated industries (FinTech, HealthTech).
Zaxion creates an **Immutable Audit Trail**. You can export a report that shows:
*   Every PR that was blocked.
*   Why it was blocked (which policy).
*   Who overrode a block (and their justification).
*   Time-stamped proof of enforcement.

This turns "compliance" from a manual headache into an automated report.

## "What permissions does Zaxion need?"
The app asks for the **minimum** permissions required to do the job:
1.  **Read Code:** To analyze the diffs.
2.  **Write Checks:** To block the merge button when rules are broken.
3.  **Write Comments:** To tell developers how to fix the issue.

Zaxion does **not** ask for permission to push code to your repository or delete branches. It acts as a gatekeeper, not a super-user.
