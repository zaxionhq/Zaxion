# Axion PR GATE (The Core Concept)

You built **Step 2 of a product before Step 1 existed**.

Step 1 = Enforcement

Step 2 = Assistance

## Introduce a new entry point (do NOT kill the old one)

Right now:

```
User →Login → Repo → File → Workspace

```

Add a second path:

```
GitHub PR → Webhook → Analysis → Decision → Gate

```

You now have **two modes**:

| Mode | Purpose |
| --- | --- |
| Interactive Mode | Developer-initiated test creation |
| Gate Mode | System-initiated test enforcement |

## What a PR Gate is (in plain English)

A **PR Gate** is a rule that decides whether a pull request:

- ✅ can merge
- ❌ must be blocked
- ⚠️ requires manual override

GitHub already supports this concept via **Required Status Checks**.

You are plugging intelligence into that mechanism.

---

## PR Gate lifecycle (high-level)

```
PR opened / updated
        ↓
GitHub Webhook fires
        ↓
Your backend analyzes the PR
        ↓
You POSTa status backto GitHub
        ↓
GitHub blocks or allows merge

```

That’s it.

No UI needed initially.

---

## What makes YOUR PR Gate different

Your gate:

- Understands **code impact**
- Decides **which tests should exist**
- Enforces **test presence**, not just test pass/fail

This is why Cursor can’t do this.

---

# 2️⃣ GitHub PR Webhook

## What it is

A **webhook** is GitHub calling *your backend* when something happens.

Events you care about:

- `pull_request.opened`
- `pull_request.synchronize` (new commits pushed)
- `pull_request.reopened`

---

## How to implement it (step-by-step)

### Step 1: Create a webhook endpoint

Backend (FastAPI / Express):

```
POST /webhooks/github

```

This endpoint must:

- Be public (ngrok during dev)
- Respond fast (< 5s)
- Verify GitHub signature (important)

---

### Step 2: Verify webhook signature (non-negotiable)

GitHub sends:

- `X-Hub-Signature-256`

You:

- Hash payload with your secret
- Compare signatures

If you skip this → **not enterprise-ready**

---

### Step 3: Parse PR payload

From webhook payload you extract:

- `repository.owner.login`
- `repository.name`
- `pull_request.number`
- `pull_request.base.ref`
- `pull_request.head.ref`

That’s enough.

---

### Step 4: Immediately ACK GitHub

Respond:

```
200 OK

```

Do **NOT** block webhook while analyzing.

Queue the job.

---

# 3️⃣ PR Diff Analyzer (Your Brain Input)

## What this does

The PR Diff Analyzer answers:

> “What actually changed?”
> 

Not files.

Not commits.

**Impact.**

---

## How to implement it

### Step 1: Fetch PR files

GitHub API:

```
GET /repos/{owner}/{repo}/pulls/{pr_number}/files

```

This gives:

- Changed file paths
- Additions / deletions
- Patch hunks

---

### Step 2: Filter irrelevant files

Ignore:

- Docs
- README
- Configs (optional)
- Lockfiles (initially)

Focus on:

- `src/`
- Business logic folders

This alone reduces noise by 50%.

---

### Step 3: Classify change type

For each file:

- Logic change
- New feature
- Refactor
- Signature change

You already have AI analysis — reuse it here.

---

### Step 4: Map to “affected areas”

This is important.

Example:

```
src/auth/login.ts → auth
src/billing/subscription.ts → billing

```

Hardcode mapping initially.

Don’t overthink.

---

# 4️⃣ Decision Object (THIS is your product)

## What it is

A **Decision Object** is the final, auditable output of your system.

It must be:

- Serializable
- Deterministic
- Explainable

No vibes.

No prose.

---

## Example Decision Object (Phase 3 Enterprise Spec)

```json
{
  "repo": "org/payments",
  "prNumber": 142,
  "decision": "BLOCK",
  "decisionReason": "Deterministic policy blocked this PR due to missing tests in high-risk areas (auth, billing).",
  "policy_version": "1.0.0",
  "evaluationStatus": "FINAL",
  "facts": {
    "changedFiles": ["src/auth/login.ts", "src/billing/subscription.ts"],
    "testFilesAdded": 0,
    "affectedAreas": ["auth", "billing"],
    "totalChanges": 150,
    "isMainBranch": true,
    "hasCriticalChanges": true
  },
  "advisor": {
    "riskAssessment": {
      "level": "HIGH",
      "confidence": 0.85
    },
    "suggestedTestIntents": ["login.logic.check", "subscription.logic.check"],
    "rationale": "AI analysis confirms high-risk business logic changed without corresponding tests. Focus generation on edge cases."
  },
  "ui": {
    "fix_link": "http://localhost:5173/workspace?repo=org/payments&pr=142"
  },
  "override": {
    "allowed": true,
    "requiredRole": "REPO_ADMIN",
    "justificationRequired": true
  },
  "timestamp": "2026-01-01T12:00:00.000Z"
}
```

This object:

- Feeds GitHub
- Feeds UI
- Feeds logs
- Feeds analytics

This is your **system of record**.

---

## How you generate it (logic)

1. Diff Analyzer → affected files
2. Strategy AI → required test intents
3. Repo scan → existing tests
4. Compare → missing tests
5. Apply policy:
    - Missing tests + high risk → BLOCK
    - Low risk → WARN
    - All tests present → PASS

This is rules + AI, not AI-only.

---

# 5️⃣ Required Status Check (Enforcement)

## What this is

GitHub allows repos to say:

> “This PR cannot merge unless status X is green.”
> 

You will create:

```
git-code-guru/test-gate

```

---

## How to implement it

### Step 1: Post status to GitHub

Use:

```
POST /repos/{owner}/{repo}/statuses/{commit_sha}

```

State values:

- `success`
- `failure`
- `pending`

---

### Step 2: Map Decision → Status

| Decision | GitHub Status |
| --- | --- |
| PASS | success |
| BLOCK | failure |
| WARN | success + note |
| RUNNING | pending |

---

### Step 3: Configure repo settings

In GitHub:

- Enable “Require status checks before merging”
- Select `git-code-guru/test-gate`

Now you are **in the merge path**.

---

## UX when blocked (important)

Status message example:

> ❌ Test Gate Failed
> 
> 
> Missing tests detected for billing logic
> 
> → Open in Git Code Guru
> 

That link opens your existing workspace **preloaded**.

🔥 This is where your UI suddenly becomes essential.

---

# 6️⃣ How this fits your CURRENT architecture (no waste)

Let’s map this to what you already built:

| Your Existing Feature | Used Here? |
| --- | --- |
| OAuth | ✔ |
| Repo/Branch selector | ✔ |
| File tree sync | ✔ |
| AI Strategy | ✔ (core brain) |
| Monaco IDE | ✔ (fixing blocked PRs) |
| Live terminal | ✔ (verification) |
| PR creation | ✔ (closing loop) |

Nothing is wasted.

You just added **authority**.

---

# 7️⃣ What I would build FIRST (order matters)

If I were you, I’d do this **in order**:

1. GitHub PR webhook (no AI yet)
2. Diff fetch + file listing
3. Post dummy FAIL status
4. Make PR unmergeable (huge milestone)
5. Add Decision Object
6. Plug AI into requiredTests
7. Add “Open in Workspace” deep link

Stop there.

That alone is a serious product.

# System Diagram (Textual)

```
GitHub PREvent
      │
      ▼
Webhook Receiver (FastAPI)
      │
      ▼
Queue (Async)
      │
      ▼
PR Gate Orchestrator
      │
      ├──▶ PR Diff Analyzer
      │        │
      │        ▼
      │    Risk Profile
      │
      ├──▶ Test Analysis Engine
      │        │
      │        ▼
      │    Coverage / Test Presence
      │
      ├──▶ AI Test Generator (Optional)
      │
      ▼
Policy Engine
      │
      ▼
DecisionObject
      │
      ├──▶ GitHub Status Check (PASS/BLOCK)
      └──▶ UI / Audit Logs

```

---

# What I Would Do If I Were You (No Sugar)

### STOP building UI now.

You already have enough.

### Build in THIS ORDER:

1. **Webhook receiver**
2. **PR diff analyzer**
3. **Policy engine (hardcoded rules)**
4. **Decision object**
5. **GitHub status check**
6. THEN integrate AI

---

# Final Brutal Truth

Without PR Gate →

You are just another AI code toy.

With PR Gate →

You are building **a CI governor**, not a chatbot.

That’s a **real product**.

### you must do things in this order:

### 1️⃣ **PR GATE (enforcement infrastructure)**

### 2️⃣ **POLICIES (decision logic)**

**Not the other way around.**

Policies without a gate are **advice**.

A gate without policies is **a locked door with no rules** — but at least the door exists.

---

## Why this order is non-negotiable

### ❌ If you build Policies first

You’ll have:

- Beautiful rules
- Smart logic
- No enforcement

Result:

> “Cool dashboard… but developers can ignore it.”
> 

That dies in enterprise.

---

### ✅ If you build PR Gate first

You get:

- Authority
- Integration into GitHub’s merge flow
- Immediate value

Then policies become:

- Plug-and-play
- Incrementally powerful
- Monetizable

---

## If I were you: EXACT execution plan

I’ll tell you **what I would freeze**, **what I would build**, and **how far I would go** — no overengineering.

---

# PHASE 1 — PR GATE (Foundation)

### 🎯 Goal

> Make GitHub wait for your system’s decision before allowing a merge.
> 

Nothing else matters until this works.

---

### What I would build (ONLY these)

### 1️⃣ GitHub App + Webhooks

Events:

- `pull_request.opened`
- `pull_request.synchronize`
- `pull_request.reopened`

This is your **trigger**.

---

### 2️⃣ PR Context Collector

On webhook:

- Fetch PR diff
- Fetch changed files
- Fetch base & head branch

Store:

```json
{
  prId,
  repo,
  branch,
  changedFiles,
  timestamp
}

```

No AI yet.

---

### 3️⃣ Status Check Writer (Critical)

Create a GitHub **Check Run**:

States:

- `IN_PROGRESS`
- `COMPLETED: SUCCESS`
- `COMPLETED: FAILURE`

Hardcode for now:

> ❌ “Blocked — policy engine not yet configured”
> 

The merge button must turn **red**.

If you can’t block a PR yet, stop everything.

---

### Enterprise-grade checklist for Phase 1

✅ Works for any repo

✅ Deterministic

✅ No UI dependency

✅ No human intervention

✅ GitHub-native enforcement

This alone already has value.

---

# PHASE 2 — Minimal Policy Engine (Not Fancy)

Now that you control the merge button, you add **reasoning**.

---

### What I would build (MVP policies)

Only **3 policies**. No more.

### Policy 1 — High-risk files require tests

```
IF auth/payment/config files changed
AND notest files changed
→ BLOCK

```

### Policy 2 — Large PR warning

```
IF changed files>N
→WARN

```

### Policy 3 — Untested code allowed on feature branches

```
IFbranch!=main
→WARN instead of BLOCK

```

That’s enough to sell.

---

### Policy Engine Architecture (Enterprise-safe)

- Policies stored in DB
- Evaluated synchronously
- Output **one Decision Object**
- Fully logged

No AI inside policies yet.

---

# PHASE 3 — Integrate Your Existing System (This is where you win)

Now plug in what you already built.

### When PR is BLOCKED:

- Attach:
    - Affected files
    
    - Suggested tests (from AI analysis)
- Add link:
    
    > “Fix with Git Code Guru”
    > 

Now your UI becomes **mandatory**, not optional.

---

## Decision Object Hardening (Phase 3 Enterprise)

To ensure this system is ready for high-compliance environments, we have refined the **Decision Object** with 5 critical enhancements:

1.  **Ambiguity Removal**: Renamed `status` to `evaluationStatus: "FINAL"`. This prevents confusion with GitHub PR states or CI pipeline statuses.
2.  **Reason Separation**: Split the generic `reason` field into:
    *   `decisionReason`: A deterministic, policy-derived string (e.g., "Missing tests in auth area").
    *   `advisor.rationale`: AI-provided context and suggestions for the developer.
3.  **Determinism Safety**: Nested `riskLevel` under `advisor.riskAssessment`. This explicitly signals that risk is an advisory metric, while the `decision` remains purely rules-based.
4.  **Enterprise Overrides**: Replaced the simple `overrideAllowed` boolean with a structured `override` object. This defines which roles (e.g., `REPO_ADMIN`) can override and requires a justification for audit logs.
5.  **Storage Integrity**: The system now stores the entire Decision Object in a `raw_data` column (JSONB) while maintaining indexed columns (`repo_owner`, `repo_name`, `pr_number`, `decision`, `policy_version`) for rapid searching and analytics.

---

## 🚀 Phase 4 Roadmap: Known Gaps & Future Hardening (COMPLETED)

Phase 4 hardening is now fully implemented. The system now enforces enterprise-grade security and auditability:

### ✅ 1. Override Authorization Model (Roles)
*   **Status**: COMPLETED
*   **Implementation**: The system now verifies the user's GitHub permission level (`admin` or `maintainer`) before allowing an override. This is enforced at the API level via [github.controller.js](file:///c:/Users/hamza/OneDrive/Desktop/hamza/backend/src/controllers/github.controller.js).

### ✅ 2. Override Replay Protection
*   **Status**: COMPLETED
*   **Implementation**: The system blocks re-execution of overrides if the current decision is already `OVERRIDDEN_PASS`. This prevents redundant audit logs and "override spam."

### ✅ 3. UI Override Flow
*   **Status**: COMPLETED
*   **Implementation**: A full UI flow is now available in the [AnalysisView](file:///c:/Users/hamza/OneDrive/Desktop/hamza/frontend/src/components/AnalysisView.tsx). Users can enter a PR number to fetch its current Quality Gate status and, if authorized, provide a justification to bypass blocks via the [PRGateStatus](file:///c:/Users/hamza/OneDrive/Desktop/hamza/frontend/src/components/PRGateStatus.tsx) component.

---

## How I Would Make It Enterprise-Grade (Key Moves)

### 1️⃣ Determinism first, AI second

Policies must:

- Always produce same result for same input
- Never depend on temperature or prompts

AI is an **advisor**, not a judge.

---

### 2️⃣ Audit everything

Store:

- PR
- Policy version
- Facts
- Decision
- Override (if any)

This is compliance gold.

---

### 3️⃣ Version policies

Never mutate rules.

Always version them.

Why?

- Rollbacks
- Postmortems
- Trust

---

### 4️⃣ Explicit overrides (never silent)

If override allowed:

- Who overrode
- Why
- Logged

Enterprises demand this.

---

### 5️⃣ Fail closed, not open

If your service is down:

- PR is BLOCKED
- Message explains why

This is how real gates work.

---

I’ll explain it **slowly**, **from first principles**, with **examples**, **what breaks if you ignore it**, and **how you implement it correctly**.

## The statement again

> Determinism first, AI second
> 
> 
> Policies must:
> 
> - Always produce the same result for the same input
> - Never depend on temperature or prompts
> 
> AI is an **advisor**, not a **judge**
> 

Let’s unpack every word.

---

# 1️⃣ What does “Determinism” mean (in plain English)?

**Determinism = predictability**

It means:

> If the same PR comes in twice,
> 
> 
> your system must give the **exact same decision**, every time.
> 

No randomness.

No “this time it passed, this time it blocked”.

No vibes.

---

## Concrete example

PR #142 changes:

- `src/auth/login.ts`
- No test files added

### Deterministic system

```
Result → BLOCK
Reason → Auth files changedwithout tests

```

Every time.

For every user.

On every retry.

---

### Non-deterministic (AI-driven) system ❌

First run:

> “Looks risky, block this PR”
> 

Second run:

> “Seems acceptable, allow merge”
> 

Third run:

> “Recommend adding tests, but optional”
> 

This is **catastrophic**.

---

# 2️⃣ Why policies MUST be deterministic

Because **policies are laws**, not opinions.

### Real-world analogy

- A traffic light must always turn red after yellow
- A judge must apply the same law to the same crime
- A compiler must give the same output for the same input

If behavior changes randomly:

- People lose trust
- Systems become unusable
- Enterprises walk away

---

# 3️⃣ Why AI can NEVER be the judge

AI is:

- Probabilistic
- Non-repeatable
- Prompt-sensitive
- Temperature-dependent

That makes AI **unsuitable for authority**.

---

## Example of AI as judge (this is what NOT to do)

❌ Policy logic:

> “Ask the AI if this PR needs tests”
> 

Prompt:

> “Does this PR require tests?”
> 

Today’s answer:

> “Yes, tests are required”
> 

Tomorrow’s answer:

> “Tests are recommended but not mandatory”
> 

Same PR. Different decision.

**This kills enterprise adoption instantly.**

---

# 4️⃣ What “AI is an advisor” actually means

AI is allowed to:

- Analyze
- Suggest
- Explain
- Recommend
- Summarize risk

AI is NOT allowed to:

- Decide PASS / BLOCK
- Enforce rules
- Control merge permission

---

## Correct mental model

Think of roles:

| Component | Role |
| --- | --- |
| Policy Engine | Judge |
| PR Gate | Police |
| AI | Expert witness |
| Developer | Defendant |

The judge listens to the expert —

but the expert **never delivers the verdict**.

---

# 5️⃣ Correct architecture (this is critical)

### Step-by-step flow

### 1️⃣ Collect facts (deterministic)

- Files changed
- Test files added
- Lines changed
- Branch name

These are **objective facts**.

---

### 2️⃣ Ask AI for analysis (non-authoritative)

AI can output:

```json
{
  "riskAssessment": {
    "level": "HIGH",
    "confidence": 0.9
  },
  "affectedAreas": ["auth"],
  "suggestedTestIntents": ["login.failure.check", "session.expiry.check"],
  "rationale": "High risk detected in authentication logic. Recommend edge case testing."
}
```

This is **advice**, not law.

---

### 3️⃣ Policy engine evaluates rules (deterministic)

Policy:

```
IF affectedAreas contains "auth"
AND testFilesAdded == 0
THEN BLOCK
```

No AI involved here.

---

### 4️⃣ Decision is made

```json
{
  "decision": "BLOCK",
  "decisionReason": "Deterministic policy blocked this PR due to missing tests in high-risk areas (auth).",
  "evaluationStatus": "FINAL",
  "facts": {
    "changedFiles": ["src/auth/login.ts"],
    "testFilesAdded": 0
  }
}
```

Same input → same output. Always.

---

# 6️⃣ Why temperature & prompts are forbidden in policies

Because:

- Temperature introduces randomness
- Prompt changes introduce inconsistency
- Model upgrades change behavior
- Providers change models silently

If your **enforcement logic** depends on AI:

- A model update can break your rules
- You lose control of your system
- You can’t guarantee outcomes

Enterprise buyers will ask:

> “What happens when the model changes?”
> 

If your answer isn’t:

> “Nothing — enforcement is deterministic”
> 

You’re dead.

---

# 7️⃣ Where AI DOES belong (important)

AI belongs in:

✅ Risk scoring

✅ Test strategy generation

✅ Suggested coverage gaps

✅ Explanation to humans

✅ Fix recommendations

AI must NEVER sit in:

❌ Policy conditions

❌ Merge decisions

❌ Status checks

❌ Enforcement logic

---

# 8️⃣ One-line rule to remember (burn this into your brain)

> AI can explain decisions — it must never make them.
> 

---

# 9️⃣ What happens if you ignore this (brutal truth)

If AI is the judge:

- Decisions change over time
- Developers argue
- You can’t debug
- You can’t audit
- You can’t sell to enterprise

You become:

> “An unpredictable AI toy that blocks PRs randomly”
> 

That’s the fastest way to kill your product.

---

# 🔟 Why investors LOVE this principle

Because it means:

- Stability
- Control
- Compliance
- Long-term contracts

They don’t want “smart”.

They want **reliable**.

---

## Final mental picture

Your system should behave like:

> A strict, boring, predictable security guard
> 
> 
> who listens to smart advisors
> 
> but always follows written law.
> 

That’s enterprise-grade.

---

I’ll explain **each point separately**, with **real-world analogies**, **why it exists**, and **what happens if you ignore it**.

# 1️⃣ “Audit Everything” — What does this actually mean?

### Simple meaning

> Your system must remember WHY it allowed or blocked a PR. Forever.
> 

That’s it.

---

## Think of it like CCTV cameras in a bank

A bank doesn’t say:

> “Trust us, we checked.”
> 

They say:

> “Here’s the footage, timestamp, camera ID, and guard on duty.”
> 

Your PR Gate is the **bank guard**.

---

## What exactly do you store?

When a PR happens, store **one record**:

### Example (human-readable)

> PR #142 was blocked
> 
> 
> because Policy v3.1
> 
> detected auth files changed
> 
> without test updates
> 
> decision made at 14:32
> 
> by system
> 
> no override
> 

### In system terms (don’t panic):

- PR details (repo, branch, PR number)
- Policy **version**
- Facts (files changed, test files added)
- Final decision (PASS / WARN / BLOCK)
- Override info (if someone bypassed it)

---

## Why this matters (brutal truth)

Without audit logs:

- Users say “Your tool blocked my PR incorrectly”
- You have **no proof**
- You can’t debug
- You can’t defend decisions
- Enterprises **won’t trust you**

With audit logs:

- You say “Here is the exact rule and data”
- Argument ends

This is **non-negotiable** for enterprise.

---

# 2️⃣ “Version Policies” — Why can’t I just edit a rule?

This is CRITICAL.

---

## Wrong way (most startups)

You change a policy:

> “Now auth rules are stricter”
> 

Yesterday’s PRs?

🤷 Nobody knows what rule was applied.

---

## Correct way (enterprise way)

Policies are **immutable**.

You do:

- Policy v1 → old rule
- Policy v2 → new rule

Old PRs still reference v1.

New PRs use v2.

---

## Real-world analogy

Think of laws.

When a law changes:

- Old cases are judged by **old law**
- New cases use **new law**

You don’t rewrite history.

---

## Why this matters

If a production bug happens:

- Management asks: “Why did this pass?”
- You answer: “Because policy v1 allowed it”
- Then: “We fixed it in v2”

Without versioning:

- You look incompetent
- Or dishonest

---

# 3️⃣ “Explicit Overrides” — Why not just allow bypass?

Because **silent overrides destroy trust**.

---

## Bad system

Senior dev merges PR anyway.

No record.

No reason.

No trace.

Later:

> “Why did this broken code ship?”
> 

Everyone shrugs.

---

## Correct system

Override is:

- Visible
- Logged
- Accountable

### Example:

> Override by @tech_lead
> 
> 
> Reason: Hotfix for production outage
> 
> Timestamp recorded
> 

Now:

- Everyone knows **why**
- No blame games
- No mystery

---

## Important rule

Overrides should be:

- Rare
- Explicit
- Painful enough to think twice

That’s how real safety systems work.

---

# 4️⃣ “Fail Closed, Not Open” — This sounds scary, right?

Yes — and it’s **intentional**.

---

## Fail OPEN (bad)

If your system is down:

> “Eh, let PRs merge anyway”
> 

Result:

- Bugs ship
- Security holes pass
- Gate becomes meaningless

Enterprises **will never accept this**.

---

## Fail CLOSED (correct)

If your system is down:

> “Merge blocked — quality gate unavailable”
> 

Why?

Because:

- Safety > speed
- Temporary pain > permanent damage

---

## Real-world analogy

Traffic lights fail → intersection becomes **stop**, not free-for-all.

Airplane system fails → plane does **not** take off.

Same principle.

---

## But what about productivity?

You show a clear message:

> “PR blocked because quality gate is temporarily unavailable. Retry shortly.”
> 

This builds trust.

---

# Putting it all together (VERY IMPORTANT)

These four things are **not features**.

They are **trust guarantees**.

| Concept | What it guarantees |
| --- | --- |
| Audit logs | “We can explain every decision” |
| Policy versions | “We don’t rewrite history” |
| Explicit overrides | “Humans are accountable” |
| Fail closed | “We prioritize safety” |

---

## What is missing (small, but important)

These are **not conceptual gaps**, just things you haven’t explicitly named yet.

### 🔴 Missing #1: Check Runs vs Statuses

You mention `POST /statuses`, which works, but:

**Enterprise-grade implementation should use GitHub Check Runs**, not commit statuses.

Why?

- Rich annotations
- Per-file messages
- Inline explanations
- Better UX in PR view

👉 This is an *implementation upgrade*, not a conceptual flaw.

### 🔴 Missing #2: Idempotency

Webhook retries will happen.

You must guarantee:

> Same PR + same commit SHA → same Decision Object
> 

Practically:

- Use `(repo, prNumber, headSha)` as an idempotency key
- Never re-run analysis unnecessarily

This reinforces determinism.

---

### 🔴 Missing #3: Policy version reference in Decision Object

You imply it later, but **add it explicitly**:

```json
"policyVersion":"v1.2.0"

```

This matters for audits and rollbacks.

---

### 🔴 Missing #4: Override is a *separate* decision

Override should produce a **new Decision Object**, not mutate the old one.

This preserves history.

---

## 3️⃣ Things I would tighten (language + clarity)

These are small wording improvements that make you sound sharper to investors and senior engineers.

### Replace this:

> “Strategy AI → required test intents”
> 

With:

> “AI-generated test intent suggestions (non-authoritative)”
> 

That single phrase reinforces safety and control.

---

### Clarify WARN behavior

Right now WARN maps to `success + note`.

Be explicit:

- WARN never blocks
- WARN is informational
- WARN is logged

Enterprises care about this distinction.

---

### One more explicit rule

Add this sentence somewhere (it matters):

> PR Gate never writes code. It only blocks, allows, or explains.
> 

This avoids confusion with your interactive mode.

---

## 4️⃣ The one mental model you must keep forever

If you remember nothing else, remember this:

> Your system is not an AI product.
It is a governance system that happens to use AI.
> 

That framing:

- Protects you from over-AI-ing things
- Makes enterprises comfortable
- Makes investors confident you understand risk

---
feat(pr-gate): enforce override authorization, replay protection, and UI flow

This commit finalizes the PR Gate override system by enforcing
authorization, preventing override replay, and exposing a complete UI flow.

NOTE:
Some underlying decision schema changes were introduced earlier but not
committed separately. This commit explicitly finalizes and wires the
override enforcement and UI layers.

Backend:
- Enforced role-based override authorization via GitHub permissions
  (admin / maintain only)
- Added replay protection to prevent multiple overrides on the same decision
- Hardened override state transitions (OVERRIDDEN_PASS is terminal)

Frontend:
- Added live PR Gate status and override UI
- Integrated justification flow and audit visibility

Documentation:
- Updated core concept docs to mark override system as completed

Files touched (explicit):
Backend:
- backend/src/controllers/github.controller.js
- backend/src/routes/github.routes.js
- backend/src/services/githubReporter.service.js

Frontend:
- frontend/src/hooks/usePRGate.ts
- frontend/src/components/PRGateStatus.tsx
- frontend/src/views/AnalysisView.tsx

Docs:
- docs/Axion-PR GATE(Core Concept).md
