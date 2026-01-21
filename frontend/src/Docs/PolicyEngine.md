# Policy Engine & Gating Guide

## 1. High-Risk File Gating
Zaxion automatically identifies changes in sensitive directories. By default, these include:
*   `**/auth/**/*`
*   `**/payment/**/*`
*   `**/config/**/*`
*   `**/.env*`

## 2. Defining Custom Rules
Rules are defined in JSON/YAML and versioned. A typical rule looks like:
```json
{
  "name": "Strict Auth Policy",
  "scope": "**/auth/**",
  "min_tests": 1,
  "level": "MANDATORY"
}
```

## 3. Admin Overrides
Maintainers can bypass gates by commenting on the PR with a specific justification. This triggers an **Override Signature** event in the Governance Memory.
