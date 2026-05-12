# Zaxion Incremental Architecture: File-by-File Execution Map

## Purpose

Translate the incremental architecture into concrete, low-risk changes mapped to current Zaxion services and files.

This document complements:
- `Incremental Architecture/ZAXION_INCREMENTAL_ANALYSIS_DESIGN.md`
- `Incremental Architecture/ZAXION_INCREMENTAL_IMPLEMENTATION_PLAN.md`

## Current System Touchpoints (Observed)

- `backend/src/services/astAnalyzer.service.js`
  - central AST enrichment (`enrichSnapshotWithAstAsync`, `analyzeFileAsync`)
  - currently Babel-first for JS/TS
- `backend/src/services/patternMatcher.service.js`
  - regex policy matching + optional AST helper for magic numbers
- `backend/src/services/evaluationEngine.service.js`
  - policy check orchestration and `getRequiredDataDepth`
  - consumes `facts.metadata.ast_by_path`, `f.ast.semanticFacts`
- `backend/src/services/policySimulation.service.js`
  - simulation replay flow
  - calls `evaluationEngine.getRequiredDataDepth` and on-demand enrichment

These are the primary seams to introduce incremental parsing/routing without breaking API contracts.

## New Modules to Add

Create these modules first (additive only):

- `backend/src/services/incremental/incrementalFeatureFlags.service.js`
  - centralized environment flag reads
  - exposes `isEnabled(flagName)` and `isForcedLegacy()`

- `backend/src/services/incremental/treeSitterParser.service.js`
  - parse file content with Tree-sitter by language
  - returns canonical syntax root and parser diagnostics

- `backend/src/services/incremental/nodeCanonicalizer.service.js`
  - converts parser-specific node to `CanonicalNode`
  - computes stable range metadata and normalized text hash

- `backend/src/services/incremental/merkleHash.service.js`
  - computes deterministic subtree hashes
  - returns root hash + node hash map

- `backend/src/services/incremental/incrementalCache.service.js`
  - layer abstractions:
    - parse cache
    - node fact cache
    - deep AST cache
    - policy eval cache

- `backend/src/services/incremental/policyRouter.service.js`
  - determines routing: `shallow`, `selective_deep`, `fallback`
  - consumes policy metadata + node tags + confidence/risk

- `backend/src/services/incremental/incrementalAnalyzer.service.js`
  - orchestrator called by AST enrichment path
  - produces `metadata.incremental` payload and transformed legacy-compatible facts

- `backend/src/services/incremental/shadowComparator.service.js`
  - compares legacy vs incremental decisions
  - emits parity metrics and mismatch diagnostics

## Data Contract (Backward-Compatible)

Preserve existing fields. Add only:

- `factSnapshot.metadata.incremental = { ... }`
  - `enabled`
  - `analysis_mode` (`legacy` | `hybrid` | `incremental`)
  - `changed_node_count`
  - `root_subtree_hashes_by_file`
  - `routing_stats`
  - `cache_hit_rates`
  - `parity` (if shadow mode)

- Optional per-file additive field:
  - `facts.changes.files[i].incremental = { node_ids, subtree_hashes, routed_policies }`

Never remove or rename:
- `metadata.ast_by_path`
- `metadata.parser_success_rate`
- existing checker-consumed fields in `evaluationEngine.service.js`

## File-by-File Change Plan

## 1) `backend/src/services/astAnalyzer.service.js` (Primary integration)

### Change Intent
- Keep existing Babel path intact.
- Introduce incremental branch before/around `analyzeFileAsync`.

### Specific Changes
- Add optional dependency injection or local import for `incrementalAnalyzer.service`.
- In `enrichSnapshotWithAstAsync`:
  - if `INCR_FORCE_LEGACY=true`: current behavior unchanged.
  - if incremental flags enabled:
    - call incremental analyzer for each supported file.
    - transform incremental output into legacy-compatible `ast_by_path` shape.
  - unsupported language or parser errors -> fallback to current `analyzeFileAsync`.
- Preserve parser success calculation semantics.

### Safety Guard
- Any incremental error must return to existing `parse_error`/legacy behavior, never throw pipeline-breaking error.

## 2) `backend/src/services/evaluationEngine.service.js` (Routing consumer)

### Change Intent
- Keep checker API and final verdict logic unchanged.
- Add routing metadata usage and selective deep escalation hooks.

### Specific Changes
- Add router initialization:
  - `this.policyRouter = new PolicyRouterService(...)`
- Extend `getRequiredDataDepth(appliedPolicies)`:
  - continue returning `{ requiresContent, requiresAst }` for compatibility
  - add optional additive fields like `requiresIncremental`, `requiresDeepAst`
- Before executing checker:
  - obtain routing decision for policy + file/node context
  - if `selective_deep`: request deep facts for candidate nodes (through incremental analyzer/deep adapter)
  - if `fallback`: run checker against current facts as-is
- Emit routing metadata into logs and result metadata (additive only).

### Safety Guard
- If router unavailable/fails, default path must be existing checker execution with legacy data.

## 3) `backend/src/services/policySimulation.service.js` (Replay compatibility)

### Change Intent
- Keep simulation determinism and replayability.
- Allow optional incremental replay metadata without changing result contract.

### Specific Changes
- Keep current call:
  - `this.evaluationEngine.getRequiredDataDepth([mockAppliedPolicy])`
- If incremental flags enabled:
  - enrich on-demand with incremental facts in addition to current enrichment path.
  - attach simulation trace:
    - `routing_path_distribution`
    - `parity_status` (if shadow compare)
    - `fallback_count`
- Keep `results.summary`, `violations`, `impacted_prs`, `per_pr_results` unchanged.

### Safety Guard
- If incremental enrichment fails mid-simulation, continue with current legacy path for that snapshot.

## 4) `backend/src/services/patternMatcher.service.js` (Gradual optimization seam)

### Change Intent
- Preserve regex checks.
- Optionally consume shallow incremental facts for targeted policies.

### Specific Changes
- Introduce optional fast-path input:
  - if incremental facts include known call identifiers/assignment tags, short-circuit some regex passes.
- Keep `analyzeCode(code, filePath)` external behavior unchanged.
- Keep `detectMagicNumbers` backward-compatible; deep path can later delegate candidate extraction from incremental node facts.

### Safety Guard
- If incremental fast-path is incomplete, always execute existing regex/AST fallback checks.

## 5) `backend/src/services/factIngestor.service.js` (if present in pipeline)

### Change Intent
- Add optional incremental enrichment stage to ingestion.

### Specific Changes
- After content fetch and before persistence:
  - call incremental analyzer for supported files.
  - store additive `metadata.incremental`.
- Do not alter core snapshot schema required by existing consumers.

### Safety Guard
- Incremental stage must be non-blocking in BEST_EFFORT mode.

## 6) Policy Definitions / Mapping Layer

Likely files:
- `backend/src/policies/corePolicies.js`
- `backend/src/utils/policyMapper.js` (used by simulation)

### Change Intent
- Add routing metadata contract per policy type.

### Specific Changes
- Add optional keys:
  - `required_depth`
  - `escalation_triggers`
  - `fallback_behavior`
  - `supported_languages`
- Keep old rule shape valid by applying defaults in router.

### Safety Guard
- Missing new metadata must never break policy loading. Defaults route to legacy-safe behavior.

## 7) Caching Utilities

Current cache utility:
- `backend/src/utils/lruCache.js` (already used by AST analyzer)

### Change Intent
- Reuse existing cache idioms while introducing incremental cache namespace.

### Specific Changes
- Add cache wrappers/adapters in `incrementalCache.service.js`.
- Keep `astCache` behavior untouched; incremental caches are additive.
- Version all keys to avoid collision with current AST cache entries.

### Safety Guard
- Cache failure should degrade to recompute, not fail policy execution.

## Incremental Rollout Sequence (Code-Level)

1. Add new incremental services (no call-sites yet).
2. Integrate into `astAnalyzer.service.js` behind flags.
3. Add router integration in `evaluationEngine.service.js` (observe-only).
4. Add shadow comparator and parity logs.
5. Enable selective deep AST for 2-3 policy types.
6. Wire simulation metadata in `policySimulation.service.js`.
7. Enable canary enforcement by policy subset.

## Policy Routing Starter Matrix (Zaxion-Specific)

- `security_patterns`: `selective_deep`
  - trigger on suspicious sinks (`eval`, command execution, SQL-like templates)
- `no_hardcoded_secrets`: `selective_deep`
  - shallow candidate + deep validation to reduce false positives
- `no_xss`: `selective_deep`
  - shallow sink detection + deep context check
- `documentation`: `shallow`
  - AST/export metadata only
- `testing_best_practices`: `shallow`
  - skipped/empty tests from structural facts
- `architecture`: `shallow` first, deep on uncertain imports
- `reliability`: `fallback` initially (until deeper flow analysis matures)

## Determinism and Replay Requirements

Apply to every incremental decision:

- Persist:
  - `node_id`, `subtree_hash`, `policy_id`, `policy_version`, `routing_path`
- Ensure sorted traversal and stable hash composition.
- Ensure simulation hash includes:
  - engine version,
  - policy version,
  - routing policy pack version.

This keeps `PolicySimulationService` replay behavior stable while evolving internals.

## CI and Test Work Items (Mapped)

Add tests near affected services:

- `backend/src/services/ast/`:
  - deterministic hash tests
  - fallback tests when incremental parser fails
- `backend/src/services/`:
  - `evaluationEngine` router decision tests
  - parity comparison tests (legacy vs incremental)
- simulation integration:
  - verify no response contract drift in `runSimulation` results

Gate checks:
- parity threshold,
- no increase in crash/fatal error rate,
- API snapshot tests for simulation responses.

## Rollback and Recovery (Mapped to Files)

- Rollback switch checked in:
  - `incrementalFeatureFlags.service.js`
  - `astAnalyzer.service.js`
  - `evaluationEngine.service.js`
- Emergency behavior:
  - all incremental calls bypassed,
  - only existing Babel/regex pipeline runs,
  - no DB/schema rollback needed (additive fields ignored).

## First PR Cut Recommendation

To keep review safe and small, first implementation PR should include only:

- new incremental service scaffolding,
- feature flag service,
- no-op integration into `astAnalyzer.service.js` that logs but does not affect outputs,
- tests proving zero behavior change with flags off.

Then follow with router/parity PR, then selective deep AST PR.

---

<!-- zaxion-doc-map-footer -->

## Repository documentation map

How this file fits in the Zaxion repo: see **[Zaxion repository documentation map](../docs/ZAXION_REPOSITORY_DOC_MAP.md)** (`docs/ZAXION_REPOSITORY_DOC_MAP.md`) for folder roles and links to system architecture.

**Text view** (works in any viewer):

```text
Zaxion/
├── docs/                    ← phase specs, governance, doc map
├── Incremental Architecture/ ← incremental plans, OPS-001
├── frontend/                ← UI (and frontend/src/Docs)
├── backend/                 ← API, policy engine, evaluation
├── PITCH/                   ← pitch materials
├── README.md                ← entry point
└── docs/ZAXION_REPOSITORY_DOC_MAP.md  ← canonical doc index
```

**Diagram** (Mermaid — quoted labels for compatibility):

```mermaid
flowchart LR
  root["Zaxion monorepo"]
  map["docs/ZAXION_REPOSITORY_DOC_MAP"]
  here["This markdown file"]
  root --> map
  map --> here
```
