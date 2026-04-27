# Zaxion Growth-First Strategy (Next 5-6 Months)

## Why this doc exists

This document captures two decisions:

1. Zaxion should prioritize user growth and revenue now.
2. New advanced features should be documented and sequenced, but not implemented yet.

---

## Core Positioning

Zaxion is not the same thing as a CI/CD pipeline.

- CI/CD automates build, test, and deployment.
- Zaxion is a policy and risk intelligence layer inside the developer workflow.
- Zaxion should become the trust and governance system that decides whether risky code should pass, warn, or block.

---

## 5-6 Month Growth Objective

Primary goal: become a revenue-generating company by converting early users into paying teams.

### Success targets

- Acquire 10-20 active engineering teams.
- Convert 3-5 teams to paid plans.
- Establish at least 2 strong case studies with measurable impact.

### Business metrics to track weekly

- New installs (GitHub App or equivalent integration)
- Activated repos (first successful analysis completed)
- Weekly active repos
- PRs analyzed per week
- Violation-to-fix rate
- Trial-to-paid conversion rate
- Churn risk signals (inactive for 7+ days)

---

## Execution Plan by Phase

### Phase 1 (Weeks 1-4): Distribution and Activation

- Tighten onboarding to first value in under 10 minutes.
- Focus messaging on one painful outcome: risky merges caught before production.
- Launch founder-led outreach to teams in one primary ICP (for example: security-sensitive SaaS teams).
- Publish simple proof content: "what Zaxion caught in real PRs."

### Phase 2 (Weeks 5-8): Paid Pilots

- Offer pilot package with direct support and weekly governance reports.
- Define clear pilot ROI:
  - critical violations caught,
  - time saved in review,
  - prevented regressions.
- Convert pilot accounts to paid monthly plans quickly.

### Phase 3 (Weeks 9-12): Scale Sales Motion

- Productize case studies, onboarding docs, and objection handling.
- Add basic self-serve pricing page with clear tiers.
- Formalize outbound + referrals + content loop.

### Phase 4 (Weeks 13-24): Revenue Stability

- Expand from pilots to annual contracts for best-fit teams.
- Introduce add-on policy packs (security, reliability, architecture).
- Build customer success rhythm focused on retention and expansion.

---

## Current Moat and How to Strengthen It

### Best moat right now

Zaxion's strongest moat is decision intelligence over time:

- historical PR decision data,
- organization-specific policy tuning,
- violation remediation patterns,
- trust score evolution per repo/team.

### Moat strategy

- Store structured decision outcomes consistently.
- Learn from overrides and false positives.
- Improve guidance quality per policy and per customer context.
- Build "switching cost" through audit history and governance memory.

---

## Future Feature Backlog (Documented, Not Implemented)

The following features are intentionally deferred until growth and revenue are stable.

### Feature A: "How to Fix This Violation" Guidance

Goal: when Zaxion catches any violation, it should provide actionable remediation guidance.

Expected experience:

- Explain what failed, why it matters, and severity.
- Show fix steps and safe code examples.
- Link to policy documentation.
- Provide suggested test additions where relevant.

Business value:

- Faster developer resolution.
- Higher trust and adoption.
- Better conversion from trial to paid.

Priority after growth milestone:

- High

---

### Feature B: Cross-File Breakage Detection from PR Changes

Problem to solve:

When a function changes in one file and silently breaks behavior in 5 other places, teams need early warning before merge.

Target capability:

- Detect changed exported/public functions.
- Build impact graph of dependent call sites/importers.
- Flag likely breaking changes (signature/contract/behavior risk).
- Trigger targeted test recommendations for impacted areas.
- Produce confidence score and explainability in the PR report.

Detection scope (future):

- Signature-level API changes
- Return-shape compatibility risk
- Removed/renamed symbols
- Exception behavior changes
- High-risk transitive impacts across modules

Business value:

- Prevent regression incidents.
- Higher enterprise trust.
- Clear premium differentiation vs generic linters.

Priority after growth milestone:

- High

---

## Sequencing Rule (Important)

Until growth targets are on track, engineering should follow this order:

1. Onboarding speed and adoption
2. Reliability of current detection/reporting
3. Revenue conversion improvements
4. Only then, major new feature implementation

---

## Immediate Team Focus (Now)

For the current period, the team should optimize for:

- user acquisition,
- activation,
- customer feedback loops,
- paid conversion,
- retention.

No major new feature implementation should begin until these are healthy and measurable.

