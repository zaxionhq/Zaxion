# 🏗️ Zaxion Phase 9: Detailed High-Level Architecture Plan

**Status:** Pre-Implementation | **Owner:** Co-Founder (Technical) | **Timeline:** 8 Weeks (Phased)  
**KPI:** Sub-100ms evaluation latency, <5% false positives, 10k users in 30 days

---

## 📋 Executive Summary

Phase 9 transforms Zaxion from a **Deterministic-First, LLM-As-Afterthought** engine to a **LLM-Native, Context-Aware, Agentic Code Governance Platform**. This document specifies the high-level architecture, component interactions, data flows, and implementation sequence for all four pillars.

**Key Architectural Principle:** Each pillar is independently deployable but designed for symbiotic integration. Pillar 1 (LLM Evaluator) can launch in Week 2 without Pillar 2 (RAG). Pillar 3 (Sandbox) integrates with Pillar 1's output. Pillar 4 (Policy Compiler) optimizes all three.

---

# 🎯 Pillar 1: LLM-First Evaluation Pipeline

## 1.1 Problem Statement

**Current State (Phase 8):**
- Rules are hardcoded JavaScript functions in `evaluationEngine.service.js`
- Adding a new rule requires backend engineering: `_checkNoMagicNumbers`, `_checkNamingConvention`, etc.
- LLM (Claude) is invoked *after* deterministic rules as a "Refiner"—only to polish existing findings.
- This means complex architectural reasoning (e.g., "Are you breaking the API contract?") must be coded manually or ignored.

**The Gap:**
Enterprises have bespoke architectural rules that are impossible to code as regex or AST traversers. A fintech team needs: *"All financial calculations must use `Decimal.js`, never native JavaScript floats."* This cannot be expressed as deterministic rules without false positives.

---

## 1.2 Pillar 1 Architecture: LLM-Native Evaluation Service

### 1.2.1 Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    PR Analysis Entry Point                  │
│                (prAnalysis.service.js - Existing)            │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼──────────┐    ┌──────▼──────────────────┐
    │  Deterministic │    │ LLM-Native Evaluator   │
    │  Evaluation    │    │ (NEW - Pillar 1)       │
    │  Engine        │    │ (llmEvaluator.service) │
    │ (Phase 8)      │    │                        │
    └────┬──────────┘    └──────┬──────────────────┘
         │                      │
         └──────────┬───────────┘
                    │
         ┌──────────▼──────────┐
         │ Unified Result      │
         │ Aggregator          │
         │ (resultAggregator)  │
         └──────────┬──────────┘
                    │
              ┌─────▼──────┐
              │ Verdict    │
              │ (Block/Pass)│
              └────────────┘
```

### 1.2.2 LLM Evaluator Service Architecture (`llmEvaluator.service.js`)

**Responsibility:** Evaluate PR against **natural language policies** using Claude, with structured JSON output.

#### Input Data Structure:
```javascript
{
  // PR metadata
  prId: "12345",
  repoName: "myorg/myrepo",
  branchName: "feature/auth-refactor",
  
  // Code diff
  diff: {
    files: [
      {
        path: "src/auth/user.ts",
        language: "typescript",
        additions: 45,
        deletions: 12,
        diff_content: "@@ -10,5 +10,8 @@\n const getUser = ...",
        ast_semantic_facts: { /* from Phase 8 */ }
      }
    ]
  },
  
  // Policies to evaluate
  policies: [
    {
      id: "policy_001",
      type: "natural_language",  // NEW POLICY TYPE
      name: "No Float Math in Financial Contexts",
      description: "All calculations in /finance/* must use Decimal.js",
      severity: "critical",
      scope: "/finance/**"
    }
  ],
  
  // Repository context (from Pillar 2 RAG - optional in Phase 9.1)
  repositoryContext: { /* optional */ }
}
```

#### Processing Pipeline:

```javascript
// llmEvaluator.service.js

class LLMEvaluatorService {
  
  async evaluatePolicies(prData, policies) {
    const results = [];
    
    for (const policy of policies) {
      if (policy.type === "natural_language") {
        const result = await this._evaluateWithLLM(prData, policy);
        results.push(result);
      }
    }
    
    return results;
  }
  
  async _evaluateWithLLM(prData, policy) {
    // Step 1: Build the prompt
    const prompt = this._buildSystemPrompt(policy);
    const userMessage = this._buildUserMessage(prData, policy);
    
    // Step 2: Call Claude with structured output
    const response = await anthropic.messages.create({
      model: "claude-opus-4-20250514", // Latest model
      max_tokens: 4000,
      system: prompt,
      messages: [{ role: "user", content: userMessage }]
    });
    
    // Step 3: Parse and validate JSON response
    const parsed = this._parseStructuredOutput(response.content[0].text);
    
    // Step 4: Normalize to Zaxion violation schema
    return this._normalizeViolations(parsed, policy);
  }
  
  _buildSystemPrompt(policy) {
    // CRITICAL: This prompt must force deterministic, parseable JSON output
    return `
You are an expert code reviewer for architectural governance. Your job is to evaluate 
a Pull Request against a specific architectural policy.

POLICY: "${policy.name}"
DESCRIPTION: "${policy.description}"
SEVERITY: "${policy.severity}"

You MUST respond with ONLY valid JSON (no markdown, no explanation before/after). 
The JSON schema is:
{
  "policy_id": "string",
  "passed": boolean,
  "violations": [
    {
      "file": "string (relative path)",
      "line": number,
      "severity": "critical|high|medium|low",
      "rule_id": "string (e.g., policy_id + underscore + violation_num)",
      "message": "string (plain English explanation)",
      "code_snippet": "string (the problematic code, max 200 chars)",
      "expected": "string (what should be done instead)",
      "confidence": number (0.0 to 1.0, skip this violation if < 0.7)
    }
  ],
  "summary": "string (overall assessment in 1-2 sentences)"
}

INSTRUCTIONS:
1. Only report violations with confidence >= 0.7.
2. If the PR passes the policy, return violations: [] and passed: true.
3. For each violation, provide a concrete, actionable expected fix.
4. Do NOT include markdown, code blocks, or any text outside the JSON.
5. If you cannot parse the PR diff, return {"error": "string"}.
    `;
  }
  
  _buildUserMessage(prData, policy) {
    const files = prData.diff.files
      .filter(f => this._fileMatchesScope(f.path, policy.scope))
      .map(f => `
FILE: ${f.path}
LANGUAGE: ${f.language}
DIFF:
${f.diff_content}

SEMANTIC FACTS (AST analysis):
${JSON.stringify(f.ast_semantic_facts, null, 2)}
      `)
      .join("\n---\n");
    
    return `
Evaluate this PR against the policy "${policy.name}".

REPO: ${prData.repoName}
PR_ID: ${prData.prId}
BRANCH: ${prData.branchName}

CHANGES:
${files}

Now analyze and respond with JSON only.
    `;
  }
  
  _parseStructuredOutput(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("LLM response parsing failed:", e);
      throw new Error(`LLM returned invalid JSON: ${e.message}`);
    }
  }
  
  _normalizeViolations(parsed, policy) {
    // Convert LLM output to Zaxion's internal violation schema
    return {
      policy_id: policy.id,
      policy_name: policy.name,
      policy_type: "natural_language",
      passed: parsed.passed === true,
      violations: (parsed.violations || [])
        .filter(v => v.confidence !== undefined ? v.confidence >= 0.7 : true)
        .map(v => ({
          file: v.file,
          line: v.line,
          rule_id: v.rule_id,
          severity: v.severity,
          message: v.message,
          expected: v.expected,
          code_snippet: v.code_snippet
        })),
      summary: parsed.summary,
      evaluated_at: new Date().toISOString()
    };
  }
  
  _fileMatchesScope(filePath, scope) {
    // Simple glob matching (implement proper glob matching library)
    if (scope === "**") return true;
    if (scope.endsWith("/**")) {
      const prefix = scope.slice(0, -3);
      return filePath.startsWith(prefix);
    }
    return filePath === scope;
  }
}
```

### 1.2.3 Policy Schema Update (Database)

**New Table: `policies` (add to existing schema)**

```sql
ALTER TABLE policies ADD COLUMN (
  type ENUM('deterministic', 'natural_language') DEFAULT 'deterministic',
  llm_system_prompt TEXT NULL,              -- Optional custom prompt
  llm_model VARCHAR(100) DEFAULT 'claude-opus-4-20250514',
  confidence_threshold FLOAT DEFAULT 0.7,   -- Only report if LLM confidence >= this
  scope VARCHAR(255) DEFAULT '**',          -- Glob pattern for file matching
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast policy lookup during PR analysis
CREATE INDEX idx_policies_repo_type ON policies(repo_id, type);
```

### 1.2.4 Integration with `prAnalysis.service.js`

**Changes to existing PR analysis flow:**

```javascript
// prAnalysis.service.js (existing)

class PRAnalysisService {
  
  async analyzePR(githubEvent) {
    const prData = {
      prId: githubEvent.pull_request.id,
      repoName: githubEvent.repository.full_name,
      branchName: githubEvent.pull_request.head.ref,
      diff: await this._extractDiff(githubEvent),
    };
    
    // Step 1: Fetch all policies for this repo
    const policies = await policyRepository.getByRepo(githubEvent.repository.id);
    
    // Step 2: Split by type
    const deterministicPolicies = policies.filter(p => p.type === 'deterministic');
    const nlmPolicies = policies.filter(p => p.type === 'natural_language');
    
    // Step 3: Run deterministic rules (Phase 8 - fast)
    const detResults = await evaluationEngine.evaluatePolicies(prData, deterministicPolicies);
    
    // Step 4: Run LLM-native rules in PARALLEL (NEW - Pillar 1)
    const llmResults = await llmEvaluator.evaluatePolicies(prData, nlmPolicies);
    
    // Step 5: Aggregate results
    const allViolations = this._aggregateResults(detResults, llmResults);
    
    // Step 6: Generate patch (existing Patch Generator)
    const patches = await patchGenerator.generatePatches(prData, allViolations);
    
    // Step 7: Create GitHub comment and block
    await this._publishVerdict(githubEvent, allViolations, patches);
  }
  
  async _extractDiff(githubEvent) {
    // Use GitHub API to get raw diff
    const files = githubEvent.pull_request.files;
    
    return {
      files: await Promise.all(files.map(async (file) => ({
        path: file.filename,
        language: this._detectLanguage(file.filename),
        additions: file.additions,
        deletions: file.deletions,
        diff_content: file.patch,
        ast_semantic_facts: await this._generateAST(file) // Phase 8 reuse
      })))
    };
  }
  
  _aggregateResults(detResults, llmResults) {
    // Merge, deduplicate, sort by severity
    const allViolations = [
      ...detResults.flatMap(r => r.violations),
      ...llmResults.flatMap(r => r.violations)
    ];
    
    // Deduplicate: same file/line/rule_id
    const seen = new Set();
    return allViolations.filter(v => {
      const key = `${v.file}:${v.line}:${v.rule_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => this._severityScore(b.severity) - this._severityScore(a.severity));
  }
}
```

### 1.2.5 Cost & Latency Optimization

| **Optimization** | **Implementation** | **Impact** |
|---|---|---|
| **Batch LLM Calls** | Group all NLP policies for one PR into a single LLM prompt (5-10 policies per call) | 70% fewer API calls |
| **Caching** | Cache LLM responses by (file_hash, policy_id). If same code is analyzed twice, reuse result. | 30% latency reduction |
| **Parallel Execution** | Execute all NLP policies concurrently (managed by `Promise.all()`) | 40% faster overall |
| **Confidence Filtering** | Skip LLM if deterministic rule already caught it | Reduce false duplicates by 60% |

**Target Latencies:**
- Deterministic rules: <50ms (Phase 8)
- LLM evaluation (5-10 policies, batched): 2-4 seconds
- Total PR analysis: <5 seconds

---

# 🧠 Pillar 2: Context Window Expansion (Repo-Wide RAG)

## 2.1 Problem Statement

**Current Gap (Phase 9.1 alone):**
- LLM evaluator "sees" only the modified files in the PR.
- Blind to API contracts, cross-file dependencies, and breaking changes.
- Example: Dev changes function signature in `auth.service.ts` but LLM doesn't know `dashboard.tsx` calls it.

**The Vision:**
Inject the entire repository's "Architectural Knowledge" into the LLM's context window via Retrieval-Augmented Generation (RAG).

---

## 2.2 RAG Architecture: Repository-Wide Vector Indexing

### 2.2.1 Core Components

```
┌──────────────────────────────────────────────────────────────┐
│              GitHub App Receives PR Event                    │
└─────────────────────┬──────────────────────────────────────┘
                      │
    ┌─────────────────┴──────────────────┐
    │                                    │
    │ First Install / Initial Sync       │ PR Review (Existing)
    │                                    │
┌───▼──────────────────────┐      ┌──────▼──────────────────┐
│  Repository Indexer      │      │ Dynamic Retriever       │
│  (repoIndexer.service)   │      │ (contextRetriever)      │
│                          │      │                          │
│ 1. Enumerate all files   │      │ 1. Extract function     │
│ 2. Parse each file       │      │    names from PR diff   │
│ 3. Generate embeddings   │      │ 2. Query Vector DB      │
│ 4. Store in Vector DB    │      │ 3. Fetch dependencies   │
└───┬──────────────────────┘      └──────┬──────────────────┘
    │                                    │
    │                      ┌─────────────┘
    │                      │
    ▼                      │
┌──────────────────────────┴──────────────┐
│         Vector Database (Qdrant)        │
│ ─────────────────────────────────────── │
│ Embeddings + Metadata:                  │
│ • Function signatures                   │
│ • File locations                        │
│ • API contracts                         │
│ • Cross-file references                 │
│                                         │
│ Example vector stored:                  │
│ {                                       │
│   "content": "export function           │
│              getUser(id: string)",      │
│   "file": "src/auth/user.service.ts",   │
│   "type": "function_signature",         │
│   "related_files": ["dashboard.tsx"]    │
│ }                                       │
└─────────────────────────────────────────┘
```

### 2.2.2 Repository Indexer Service (`repoIndexer.service.js`)

**Triggered:** On app installation or via scheduled sync (daily).

```javascript
class RepositoryIndexerService {
  
  async indexRepository(repoId, repoOwner, repoName) {
    console.log(`🔍 Indexing repository: ${repoOwner}/${repoName}`);
    
    // Step 1: Clone/fetch repo (shallow)
    const repoPath = await this._cloneRepository(repoOwner, repoName);
    
    // Step 2: Enumerate all files (recursive)
    const files = await this._enumerateFiles(repoPath);
    
    // Step 3: Parse and generate semantic facts for each file
    const semanticChunks = [];
    for (const file of files) {
      const chunks = await this._parseFile(file, repoPath);
      semanticChunks.push(...chunks);
    }
    
    // Step 4: Generate embeddings
    const embeddedChunks = await this._embedChunks(semanticChunks);
    
    // Step 5: Upsert into Vector DB
    await vectorDB.upsertChunks(repoId, embeddedChunks);
    
    // Step 6: Store index metadata
    await indexMetadataDB.upsert({
      repo_id: repoId,
      indexed_at: new Date(),
      total_files: files.length,
      total_chunks: semanticChunks.length,
      status: "ready"
    });
    
    console.log(`✅ Indexed ${semanticChunks.length} chunks from ${files.length} files`);
  }
  
  async _parseFile(filePath, repoPath) {
    const fullPath = `${repoPath}/${filePath}`;
    const language = this._detectLanguage(filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    const chunks = [];
    
    // Language-specific parsing (use tree-sitter or Babel for JS/TS)
    if (['js', 'ts', 'jsx', 'tsx'].includes(language)) {
      const ast = parser.parse(content, { sourceType: 'module' });
      
      // Extract all top-level exports (functions, classes, types)
      const exports = this._extractTopLevelExports(ast, content);
      
      exports.forEach(exp => {
        chunks.push({
          file: filePath,
          type: exp.type, // "function" | "class" | "type" | "interface"
          name: exp.name,
          signature: exp.signature, // e.g., "function getUser(id: string): Promise<User>"
          content: exp.content, // Full function/class body (truncate if >1000 chars)
          line_start: exp.start,
          line_end: exp.end,
          dependencies: exp.dependencies, // Other functions/types it imports/uses
          metadata: {
            language,
            is_exported: exp.exported,
            docstring: exp.docstring // JSDoc comments
          }
        });
      });
    }
    
    // For other languages, do simple line-based chunking (fallback)
    if (chunks.length === 0) {
      const lineChunks = content.split('\n').slice(0, 100); // First 100 lines
      chunks.push({
        file: filePath,
        type: 'raw',
        content: lineChunks.join('\n'),
        metadata: { language }
      });
    }
    
    return chunks;
  }
  
  async _embedChunks(semanticChunks) {
    // Use Anthropic's embedding API or a local embedding model
    const embeddedChunks = [];
    
    for (const chunk of semanticChunks) {
      // Create a text representation suitable for embedding
      const text = `
File: ${chunk.file}
Type: ${chunk.type}
Name: ${chunk.name || 'N/A'}
Signature: ${chunk.signature || 'N/A'}

Content:
${chunk.content}

Dependencies: ${chunk.dependencies?.join(', ') || 'None'}
      `.trim();
      
      // Call embedding API
      const embedding = await embeddingService.embed(text);
      
      embeddedChunks.push({
        ...chunk,
        embedding,
        text_content: text, // Store original text for retrieval
        metadata: {
          ...chunk.metadata,
          embedding_model: 'text-embedding-3-small'
        }
      });
    }
    
    return embeddedChunks;
  }
}
```

### 2.2.3 Context Retriever Service (`contextRetriever.service.js`)

**Triggered:** During PR analysis (Pillar 1), before LLM evaluation.

```javascript
class ContextRetrieverService {
  
  async enrichPRDataWithContext(prData, repoId) {
    console.log(`📚 Enriching PR data with repository context...`);
    
    // Step 1: Extract all function/class names modified in PR
    const modifiedSymbols = this._extractModifiedSymbols(prData.diff);
    console.log(`Found modified symbols: ${modifiedSymbols.join(', ')}`);
    
    // Step 2: For each modified symbol, query Vector DB for dependent files
    const contextChunks = [];
    for (const symbol of modifiedSymbols) {
      const deps = await this._findDependencies(repoId, symbol);
      contextChunks.push(...deps);
    }
    
    // Step 3: Rank and filter (keep top 10 most relevant files to stay within token budget)
    const topChunks = contextChunks
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 10);
    
    // Step 4: Inject into prData
    return {
      ...prData,
      repositoryContext: {
        modified_symbols: modifiedSymbols,
        dependent_chunks: topChunks,
        context_window_tokens: this._estimateTokens(topChunks)
      }
    };
  }
  
  _extractModifiedSymbols(diff) {
    // Parse all function/class names from diff (use regex + AST)
    const symbols = new Set();
    
    for (const file of diff.files) {
      if (!['js', 'ts', 'jsx', 'tsx'].includes(this._detectLanguage(file.path))) {
        continue; // Skip non-JS files
      }
      
      // Simple regex to find function/class declarations
      const funcRegex = /^[\+\-]?\s*(export\s+)?(async\s+)?function\s+(\w+)/gm;
      const classRegex = /^[\+\-]?\s*(export\s+)?class\s+(\w+)/gm;
      
      let match;
      while ((match = funcRegex.exec(file.diff_content)) !== null) {
        symbols.add(match[3]);
      }
      while ((match = classRegex.exec(file.diff_content)) !== null) {
        symbols.add(match[2]);
      }
    }
    
    return Array.from(symbols);
  }
  
  async _findDependencies(repoId, symbol) {
    // Query Vector DB: "Show me all files that use this symbol"
    const query = `Uses ${symbol}() or calls ${symbol}`;
    const results = await vectorDB.search(repoId, query, {
      top_k: 20,
      threshold: 0.6
    });
    
    return results.map(r => ({
      file: r.file,
      type: r.type,
      name: r.name,
      signature: r.signature,
      content: r.text_content,
      similarity_score: r.score
    }));
  }
  
  _estimateTokens(chunks) {
    // Rough estimate: 1 token ≈ 4 characters
    const totalChars = chunks.reduce((sum, c) => sum + (c.content?.length || 0), 0);
    return Math.ceil(totalChars / 4);
  }
}
```

### 2.2.4 Enhanced LLM Prompt (Integration with Pillar 1)

**Modification to `llmEvaluator._buildUserMessage()`:**

```javascript
_buildUserMessage(prData, policy) {
  const files = prData.diff.files
    .filter(f => this._fileMatchesScope(f.path, policy.scope))
    .map(f => `
FILE: ${f.path}
LANGUAGE: ${f.language}
DIFF:
${f.diff_content}

SEMANTIC FACTS (AST analysis):
${JSON.stringify(f.ast_semantic_facts, null, 2)}
    `)
    .join("\n---\n");
  
  // NEW: Include repository context (Pillar 2)
  let repositoryContextStr = "";
  if (prData.repositoryContext) {
    const depChunks = prData.repositoryContext.dependent_chunks
      .map(chunk => `
FILE: ${chunk.file}
SYMBOL: ${chunk.name} (${chunk.type})
SIGNATURE: ${chunk.signature}

${chunk.content}
      `)
      .join("\n---\n");
    
    repositoryContextStr = `
REPOSITORY CONTEXT (Files that depend on changes):
${depChunks}

MODIFIED SYMBOLS IN THIS PR: ${prData.repositoryContext.modified_symbols.join(', ')}
    `;
  }
  
  return `
Evaluate this PR against the policy "${policy.name}".

REPO: ${prData.repoName}
PR_ID: ${prData.prId}
BRANCH: ${prData.branchName}

CHANGES:
${files}

${repositoryContextStr}

Now analyze and respond with JSON only.
  `;
}
```

### 2.2.5 Vector Database Schema (Qdrant)

**Collection Name:** `zaxion_repositories`

```json
{
  "collection_name": "zaxion_repositories",
  "vectors": {
    "size": 1536,
    "distance": "Cosine"
  },
  "payload_schema": {
    "repo_id": { "type": "keyword" },
    "file": { "type": "text" },
    "type": { "type": "keyword" },      // "function", "class", "type", "interface"
    "name": { "type": "text" },
    "signature": { "type": "text" },
    "content": { "type": "text" },       // Full source code
    "line_start": { "type": "integer" },
    "line_end": { "type": "integer" },
    "dependencies": { "type": "array" },
    "language": { "type": "keyword" },
    "is_exported": { "type": "bool" },
    "indexed_at": { "type": "datetime" }
  }
}
```

**Search Query Example:**
```javascript
{
  "vector": [/* embedding for "getUser" */],
  "limit": 20,
  "score_threshold": 0.6,
  "filter": {
    "must": [
      { "key": "repo_id", "match": { "value": "repo_12345" } }
    ]
  }
}
```

### 2.2.6 Update Triggers (Incremental Indexing)

To avoid full re-indexing on every PR, implement delta indexing:

```javascript
// Listen to GitHub push events (after PR merge)
async onRepositoryPush(event) {
  const changedFiles = event.commits[0].modified;
  
  // Only re-index changed files
  for (const file of changedFiles) {
    const chunks = await repoIndexer._parseFile(file, repoPath);
    const embedded = await repoIndexer._embedChunks(chunks);
    
    // Upsert (update or insert) into Vector DB
    await vectorDB.upsertChunks(event.repository.id, embedded);
  }
}
```

---

# 🤖 Pillar 3: The Agentic Sandbox

## 3.1 Problem Statement

**Current Reality (Phase 8):**
- `PatchGeneratorService` writes a code patch using Claude.
- **Zero verification** that the patch is syntactically correct or doesn't break tests.
- Example: Claude generates a patch with a missing closing brace. Zaxion confidently shows it to the dev.

**The Vision:**
Execute patches in an **isolated sandbox**, run tests/linters, and only show patches that **pass**. If a patch fails, ask Claude to fix it.

---

## 3.2 Sandbox Architecture: Agentic Patch Validation Loop

### 3.2.1 Core Components

```
┌──────────────────────────────────────────────────────┐
│   Patch Generator Service (Existing Phase 8)         │
│         Generates patch using Claude                 │
└────────────────────┬─────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │                       │
    ┌────▼──────────┐    ┌──────▼──────────────────┐
    │ Sandbox Pool  │    │ Agentic Loop Service    │
    │ (E2B / Docker)│    │ (patchValidator.service)│
    │               │    │                         │
    │ • Isolate     │    │ 1. Apply patch          │
    │ • Clone repo  │    │ 2. Run tests/linter     │
    │ • Apply patch │    │ 3. Parse errors         │
    │               │    │ 4. Loop to Claude       │
    └───────────────┘    │    (max 3 retries)      │
                         └──────┬──────────────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
                ┌───▼────────┐         ┌────▼─────────┐
                │ If PASS    │         │ If FAIL >3x  │
                │            │         │              │
                │ Show patch │         │ Show advisory│
                │ to dev     │         │ (human fix)  │
                └────────────┘         └──────────────┘
```

### 3.2.2 Sandbox Infrastructure Setup

**Two Deployment Options:**

| **Option** | **Pros** | **Cons** | **Recommendation** |
|---|---|---|---|
| **E2B Sandbox** | Managed, secure, sandboxed Node.js | API cost ($0.05 - $0.10 per execution), external dependency | Phase 9.3 MVP (faster ship) |
| **Docker Container** | Full control, cheaper long-term, private infra | Requires ops, security hardening | Phase 9.4+ (scale) |

**For Phase 9.3 MVP: Use E2B** (Managed Execution)

### 3.2.3 Patch Validator Service (`patchValidator.service.js`)

```javascript
const e2b = require('e2b');

class PatchValidatorService {
  
  constructor() {
    this.maxRetries = 3;
    this.sandboxTimeout = 60000; // 60 seconds per run
  }
  
  async validatePatch(patch, prData, repoData) {
    console.log(`🧪 Validating patch via sandbox...`);
    
    // Step 1: Create isolated sandbox with repo
    const sandbox = await this._createSandbox(prData, repoData);
    
    try {
      // Step 2: Apply the patch
      const applyResult = await this._applyPatch(sandbox, patch);
      
      if (!applyResult.success) {
        return {
          status: 'invalid',
          error: applyResult.error,
          details: "Patch could not be applied (git apply failed)"
        };
      }
      
      // Step 3: Run linter/tests
      const testResult = await this._runTests(sandbox, prData);
      
      if (testResult.passed) {
        return {
          status: 'valid',
          patch: patch,
          test_output: testResult.output,
          confidence: 0.95
        };
      } else {
        // Step 4: Agentic loop - try to fix the patch
        return await this._agenticRetry(
          patch, 
          testResult.error, 
          prData, 
          repoData, 
          sandbox, 
          0
        );
      }
      
    } finally {
      await sandbox.close();
    }
  }
  
  async _createSandbox(prData, repoData) {
    // Clone minimal repo into sandbox
    const sandbox = await e2b.Sandbox.create();
    
    // Install dependencies (optimized: use package-lock.json if exists)
    await sandbox.commands.run(`
      git clone --depth 1 ${repoData.git_url} /repo
      cd /repo
      npm install --legacy-peer-deps 2>/dev/null || true
    `, { timeout: this.sandboxTimeout });
    
    return sandbox;
  }
  
  async _applyPatch(sandbox, patch) {
    try {
      const result = await sandbox.commands.run(
        `cd /repo && git apply << 'EOF'\n${patch}\nEOF`,
        { timeout: 10000 }
      );
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  
  async _runTests(sandbox, prData) {
    // Detect test runner (package.json, pytest, etc.)
    const testCommand = this._detectTestCommand(prData);
    
    try {
      const result = await sandbox.commands.run(
        `cd /repo && ${testCommand}`,
        { timeout: this.sandboxTimeout }
      );
      
      return { passed: true, output: result.stdout };
    } catch (err) {
      return {
        passed: false,
        error: err.message,
        output: err.stdout || ""
      };
    }
  }
  
  async _agenticRetry(
    patch, 
    testError, 
    prData, 
    repoData, 
    sandbox, 
    retryCount
  ) {
    if (retryCount >= this.maxRetries) {
      console.log(`❌ Patch validation failed after ${this.maxRetries} retries`);
      return {
        status: 'invalid_unrepairable',
        patch: patch,
        error: testError,
        advice: "The generated patch failed tests and could not be auto-fixed. Please review and fix manually.",
        confidence: 0.1
      };
    }
    
    console.log(`🔄 Retrying patch generation (attempt ${retryCount + 1}/${this.maxRetries})...`);
    
    // Step 1: Call Claude again with the error message
    const improvedPatch = await this._regeneratePatchWithError(
      patch,
      testError,
      prData,
      repoData
    );
    
    // Step 2: Recursively validate the new patch
    return await this._validatePatchInSandbox(
      improvedPatch,
      sandbox,
      prData,
      testError,
      retryCount + 1
    );
  }
  
  async _regeneratePatchWithError(patch, error, prData, repoData) {
    // Call Claude with context about the error
    const response = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 2000,
      system: `You are a code repair expert. A patch you generated failed with a test error.
Fix the patch to resolve the error.
Return ONLY the corrected git patch (no explanation, no markdown).`,
      messages: [
        {
          role: "user",
          content: `
ORIGINAL PATCH:
${patch}

ERROR WHEN TESTING:
${error}

CONTEXT:
${JSON.stringify(prData, null, 2)}

Fix the patch and return the corrected version.
          `
        }
      ]
    });
    
    return response.content[0].text;
  }
  
  async _validatePatchInSandbox(
    patch,
    sandbox,
    prData,
    previousError,
    retryCount
  ) {
    // Reset repo state (undo previous patch)
    await sandbox.commands.run(`cd /repo && git reset --hard HEAD`);
    
    // Apply new patch
    const applyResult = await this._applyPatch(sandbox, patch);
    
    if (!applyResult.success) {
      return {
        status: 'invalid',
        error: applyResult.error,
        confidence: 0.1
      };
    }
    
    // Run tests again
    const testResult = await this._runTests(sandbox, prData);
    
    if (testResult.passed) {
      return {
        status: 'valid',
        patch: patch,
        test_output: testResult.output,
        confidence: 0.9,
        auto_fixed: true,
        retry_count: retryCount
      };
    } else if (retryCount < this.maxRetries) {
      // Recurse
      return await this._agenticRetry(
        patch,
        testResult.error,
        prData,
        repoData,
        sandbox,
        retryCount
      );
    } else {
      return {
        status: 'invalid_unrepairable',
        error: testResult.error,
        advice: "The patch could not be auto-fixed. Please review manually."
      };
    }
  }
  
  _detectTestCommand(prData) {
    // Look for common test commands in package.json or pytest
    const packageJson = prData.package_json;
    
    if (packageJson?.scripts?.test) {
      return `npm test`;
    }
    if (packageJson?.scripts?.lint) {
      return `npm run lint && npm test`;
    }
    
    // Fallback to linter only
    return `npm run lint 2>/dev/null || eslint . 2>/dev/null || echo "No linter found"`;
  }
}
```

### 3.2.4 Integration with Patch Generator (Update Phase 8)

**Modify `patchGenerator.service.js` to use validator:**

```javascript
class PatchGeneratorService {
  
  async generatePatchesForViolations(prData, violations) {
    const patches = [];
    
    for (const violation of violations) {
      // Step 1: Generate patch using Claude (existing)
      const rawPatch = await this._generateWithClaude(violation, prData);
      
      // Step 2: Validate in sandbox (NEW - Pillar 3)
      const validationResult = await patchValidator.validatePatch(
        rawPatch,
        prData,
        prData.repoData
      );
      
      // Step 3: Store result
      patches.push({
        violation_id: violation.rule_id,
        raw_patch: rawPatch,
        validation: validationResult,
        ready_to_show: validationResult.status === 'valid'
      });
    }
    
    return patches;
  }
}
```

### 3.2.5 Cost & Performance Optimization

| **Optimization** | **Implementation** |
|---|---|
| **Parallel Sandbox Execution** | Run up to 5 patches concurrently in separate sandboxes (E2B manages pooling) |
| **Sandbox Caching** | Reuse sandbox instances across patch validations in same PR |
| **Skip Validation for Low-Risk Patches** | Only validate patches for "critical" violations (others just show code) |
| **Timeout Aggressive** | 30 seconds per sandbox execution. Kill if exceeds. |

**Target:** Sub-30 second total validation time for 5 patches.

---

# ⚙️ Pillar 4: Dynamic Rule Translation (The Auto-Coder)

## 4.1 Problem Statement

**The Dilemma:**
- Pillar 1 (LLM-Native Policies) is flexible but slow (~2-4 seconds per PR per policy).
- Pillar 3 Deterministic Rules (Phase 8) are fast (<50ms) but require engineering to add new rules.
- **How do we get flexibility + speed?**

**The Solution:**
When an admin saves a natural language policy, **compile it into a deterministic JavaScript rule** that runs in <50ms.

---

## 4.2 Architecture: Policy Compiler Service

### 4.2.1 High-Level Flow

```
Admin writes policy:
"All financial calculations must use Decimal.js"
        │
        ▼
┌─────────────────────────────────┐
│ Policy Compiler Service         │
│ (policyCompiler.service)        │
│                                 │
│ 1. Parse policy text (Claude)   │
│ 2. Generate JS checker func     │
│ 3. Unit test (AST verification) │
│ 4. Store in DB                  │
└────────┬────────────────────────┘
         │
         ▼
Dynamic JavaScript Function:
function checkDecimalUsage(ast, filePath) {
  const violations = [];
  ast.walk((node) => {
    if (node.type === 'BinaryExpression' && 
        isArithmetic(node.operator) &&
        !usesDecimal(node.left) &&
        !usesDecimal(node.right)) {
      violations.push({
        line: node.loc.start.line,
        message: "Use Decimal.js for math"
      });
    }
  });
  return violations;
}
        │
        ▼
Store in cache (Redis) + Database
        │
        ▼
On next PR: Execute directly in Phase 8 evaluation engine
(NO LLM CALL - sub-50ms execution)
```

### 4.2.2 Policy Compiler Service (`policyCompiler.service.js`)

```javascript
class PolicyCompilerService {
  
  async compilePolicy(policyText, policyType = 'natural_language') {
    console.log(`🔨 Compiling policy: "${policyText.slice(0, 50)}..."`);
    
    if (policyType !== 'natural_language') {
      throw new Error("Only natural_language policies can be compiled");
    }
    
    // Step 1: Use Claude to generate a checker function
    const checkerCode = await this._generateCheckerCode(policyText);
    
    // Step 2: Validate the generated code
    const validationResult = await this._validateCheckerCode(checkerCode, policyText);
    
    if (!validationResult.valid) {
      console.error("❌ Generated code failed validation:", validationResult.error);
      return {
        compiled: false,
        error: validationResult.error,
        fallback_to_llm: true
      };
    }
    
    // Step 3: Store compiled function
    const compiledPolicy = {
      id: this._generateId(),
      original_text: policyText,
      checker_code: checkerCode,
      compiled_at: new Date(),
      status: 'ready',
      execution_type: 'deterministic'
    };
    
    await policyDB.upsert(compiledPolicy);
    await redisCache.set(`policy:${compiledPolicy.id}`, checkerCode, 86400); // Cache 24h
    
    return compiledPolicy;
  }
  
  async _generateCheckerCode(policyText) {
    // Call Claude to write the checker function
    const systemPrompt = `You are an expert JavaScript/TypeScript code generation system.
Your job is to generate a deterministic AST-based checker function that implements a code policy.

The function signature MUST be:
function checkPolicy(ast, filePath) {
  // Return array of violations: [{ line, message, severity }]
}

Requirements:
1. Use Babel AST traversal with \`ast.walk()\` or similar
2. Return violations in the schema: { line: number, message: string, severity: string }
3. Do NOT call external APIs or LLMs
4. DO NOT use regex for semantic checks (only AST)
5. Handle edge cases (comments, strings, etc.)

Generate ONLY the function code, no explanation or markdown.`;

    const userPrompt = `Generate a checker function for this policy:

"${policyText}"

The function should traverse the AST and return violations when the policy is broken.`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
    
    return response.content[0].text.trim();
  }
  
  async _validateCheckerCode(code, policyText) {
    try {
      // Step 1: Syntax check
      new Function(code); // Will throw if syntax error
      
      // Step 2: Semantic check - test with sample AST
      const sampleAST = this._createSampleAST();
      const testFunction = new Function('ast', 'filePath', code);
      const result = testFunction(sampleAST, 'test.js');
      
      // Step 3: Verify return type is array
      if (!Array.isArray(result)) {
        return {
          valid: false,
          error: "Function must return an array of violations"
        };
      }
      
      // Step 4: Verify violation schema
      for (const violation of result) {
        if (typeof violation.line !== 'number' || typeof violation.message !== 'string') {
          return {
            valid: false,
            error: "Each violation must have { line: number, message: string }"
          };
        }
      }
      
      console.log(`✅ Code validation passed. Generated ${result.length} test violations.`);
      return { valid: true };
      
    } catch (err) {
      return {
        valid: false,
        error: err.message
      };
    }
  }
  
  _createSampleAST() {
    // Create a minimal, representative AST for testing
    return {
      type: 'Program',
      body: [
        {
          type: 'VariableDeclaration',
          loc: { start: { line: 1 }, end: { line: 1 } }
        },
        {
          type: 'FunctionDeclaration',
          id: { name: 'testFunc' },
          loc: { start: { line: 5 }, end: { line: 10 } }
        }
      ],
      walk: function(callback) {
        // Recursive walk for testing
        const walk = (node) => {
          callback(node);
          for (const key in node) {
            if (typeof node[key] === 'object' && node[key] !== null) {
              if (Array.isArray(node[key])) {
                node[key].forEach(walk);
              } else {
                walk(node[key]);
              }
            }
          }
        };
        walk(this);
      }
    };
  }
}
```

### 4.2.3 Integration: Compiled vs. LLM-Native Execution

**Update Phase 8 Evaluation Engine (`evaluationEngine.service.js`):**

```javascript
class EvaluationEngine {
  
  async evaluatePolicies(prData, policies) {
    const results = [];
    
    for (const policy of policies) {
      // Step 1: Check if policy is compiled (Pillar 4)
      const compiled = await this._getCompiledPolicy(policy.id);
      
      if (compiled && compiled.status === 'ready') {
        // Execute compiled function - FAST
        console.log(`⚡ Executing compiled policy: ${policy.name}`);
        const result = await this._executeCompiledPolicy(compiled, prData);
        results.push(result);
      } else if (policy.type === 'natural_language') {
        // Fallback to LLM-native (Pillar 1)
        console.log(`🧠 Executing LLM policy: ${policy.name}`);
        const result = await llmEvaluator.evaluatePolicies(prData, [policy]);
        results.push(...result);
      } else {
        // Existing deterministic logic
        const result = await this._executeDeterministicPolicy(policy, prData);
        results.push(result);
      }
    }
    
    return results;
  }
  
  async _getCompiledPolicy(policyId) {
    // Check Redis cache first
    const cached = await redisCache.get(`policy:${policyId}`);
    if (cached) return cached;
    
    // Otherwise fetch from DB
    return await policyDB.getById(policyId);
  }
  
  async _executeCompiledPolicy(compiled, prData) {
    // Create the function from code
    const checkerFunction = new Function(compiled.checker_code);
    
    const violations = [];
    
    for (const file of prData.diff.files) {
      if (!['js', 'ts', 'jsx', 'tsx'].includes(this._detectLanguage(file.path))) {
        continue;
      }
      
      // Parse AST
      const ast = babelParser.parse(file.diff_content);
      
      // Execute checker
      const fileViolations = checkerFunction(ast, file.path);
      
      violations.push(...fileViolations.map(v => ({
        file: file.path,
        ...v
      })));
    }
    
    return {
      policy_id: compiled.id,
      passed: violations.length === 0,
      violations
    };
  }
}
```

### 4.2.4 Execution Performance Comparison

| **Policy Type** | **Execution Method** | **Latency** | **Flexibility** |
|---|---|---|---|
| **Deterministic** (Phase 8) | Direct JS function | <10ms | Low (hardcoded) |
| **Compiled NLP** (Pillar 4) | Generated JS function | 10-50ms | High (any policy text) |
| **LLM-Native** (Pillar 1) | Claude API call | 2-4s | Very high (unlimited) |

**Strategy:**
1. New policy is saved as `natural_language`
2. Compiler generates JS version (background job)
3. If compilation succeeds → use Compiled version (10-50ms)
4. If compilation fails → fallback to LLM (2-4s) but warn admin

---

# 🔗 Cross-Pillar Integration & Data Flow

## 5.1 Complete End-to-End PR Analysis Flow

```
GitHub Push Event (PR opened/updated)
        │
        ▼
┌─────────────────────────────────────────────────────┐
│ Step 1: Extract Diff & Semantic Facts               │
│ (Existing prAnalysis.service - Phase 8)             │
│                                                     │
│ Output: prData = {                                  │
│   files: [{ path, language, diff, ast_facts }],   │
│   ...                                               │
│ }                                                   │
└────────────────┬────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │ PILLAR 2       │
         │ Context        │
         │ Retrieval      │
         └───────┬────────┘
                 │
      Enrich prData with:
      - modified_symbols
      - dependent_chunks (from Vector DB)
      - repository context window
                 │
         ┌───────▼────────────────────────────────┐
         │ PILLAR 1 + PILLAR 4 Evaluation         │
         │ (Deterministic + Compiled + LLM-Native)│
         │                                        │
         │ For each policy:                       │
         │ 1. Is it compiled? → Execute (50ms)    │
         │ 2. Is it natural_language? → LLM (2s) │
         │ 3. Is it deterministic? → JS (10ms)   │
         │                                        │
         │ Output: unified violations list        │
         └───────┬────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │ PILLAR 3       │
         │ Sandbox        │
         │ Patch          │
         │ Validation     │
         └───────┬────────┘
                 │
      For each violation:
      1. Generate patch (Claude)
      2. Apply in sandbox (E2B)
      3. Run tests
      4. If fail → Agentic retry (max 3x)
      5. Return validated patch or fallback
                 │
         ┌───────▼────────────────────────────────┐
         │ Step 5: Generate GitHub Comment        │
         │ (Existing - Phase 8)                   │
         │                                        │
         │ Display:                               │
         │ - Violations (organized by severity)   │
         │ - Validated patches                    │
         │ - Actionable fixes                     │
         └────────────────────────────────────────┘
```

## 5.2 Database Schema Changes (Summary)

**New Tables:**
```sql
-- Compiled policies (Pillar 4)
CREATE TABLE compiled_policies (
  id VARCHAR(36) PRIMARY KEY,
  original_policy_id VARCHAR(36),
  original_text TEXT,
  checker_code LONGTEXT,
  compiled_at TIMESTAMP,
  status ENUM('pending', 'ready', 'error') DEFAULT 'pending',
  error_message TEXT NULL
);

-- Vector DB metadata (Pillar 2)
CREATE TABLE index_metadata (
  repo_id VARCHAR(36) PRIMARY KEY,
  indexed_at TIMESTAMP,
  total_files INT,
  total_chunks INT,
  status ENUM('indexing', 'ready', 'error')
);

-- Patch validation results (Pillar 3)
CREATE TABLE patch_validations (
  id VARCHAR(36) PRIMARY KEY,
  pr_id VARCHAR(36),
  violation_id VARCHAR(36),
  raw_patch LONGTEXT,
  validation_status ENUM('valid', 'invalid', 'unrepairable'),
  test_output LONGTEXT,
  retry_count INT,
  created_at TIMESTAMP
);
```

---

# 📊 Implementation Roadmap (8 Weeks)

## Week 1-2: Pillar 1 (LLM-Native Evaluator)
- [ ] Implement `LLMEvaluatorService`
- [ ] Create `natural_language` policy type
- [ ] Build system prompt for deterministic JSON output
- [ ] Test with 5 sample policies
- [ ] Deploy to staging
- **Deliverable:** First LLM-native policy evaluation working

## Week 2-3: Pillar 2 (Repo-Wide RAG - Phase 2a)
- [ ] Set up Qdrant instance (local or cloud)
- [ ] Implement `RepositoryIndexerService`
- [ ] Build AST parser for semantic chunking
- [ ] Create embedding pipeline
- [ ] Implement delta indexing
- **Deliverable:** Repository indexing for 5 sample repos

## Week 3-4: Pillar 2 (Phase 2b - Context Retrieval)
- [ ] Implement `ContextRetrieverService`
- [ ] Build query-to-embeddings pipeline
- [ ] Integrate with Pillar 1 prompt injection
- [ ] Test retrieval accuracy
- [ ] Optimize token usage
- **Deliverable:** Full RAG pipeline working end-to-end

## Week 4-5: Pillar 3 (Agentic Sandbox)
- [ ] Set up E2B infrastructure
- [ ] Implement `PatchValidatorService`
- [ ] Build agentic loop with retries
- [ ] Integrate with Patch Generator
- [ ] Test patch validation on 10 real PRs
- **Deliverable:** Validated patches with 3-retry loop

## Week 5-6: Pillar 4 (Policy Compiler)
- [ ] Implement `PolicyCompilerService`
- [ ] Build code generation prompt
- [ ] Create validation system
- [ ] Integrate with evaluation engine
- [ ] Test compilation on 10 policies
- **Deliverable:** Compiled policies executing in <50ms

## Week 6-7: Integration & Testing
- [ ] End-to-end flow testing
- [ ] Load testing (1000 PRs/day capacity)
- [ ] False positive auditing
- [ ] Performance optimization
- [ ] Security audit
- **Deliverable:** Phase 9 ready for beta

## Week 7-8: Documentation & Deployment
- [ ] Admin UI for policy management
- [ ] API documentation
- [ ] Monitoring/alerting setup
- [ ] Rollout plan to production
- [ ] Performance analytics dashboard
- **Deliverable:** Phase 9 live in production

---

# 🚨 Risk Mitigation & Performance Considerations

## 6.1 Key Risks

| **Risk** | **Mitigation** | **Fallback** |
|---|---|---|
| **LLM API Rate Limits (Pillar 1)** | Batch policies, cache responses, use cheaper model | Fall back to compiled/deterministic |
| **Vector DB Cost (Pillar 2)** | Use self-hosted Qdrant, implement caching | Skip RAG context, use LLM with PR diff only |
| **Sandbox Timeouts (Pillar 3)** | 30s timeout per execution, aggressive kill | Skip patch validation, show code suggestion only |
| **Compiled Code Bugs (Pillar 4)** | Unit test generated functions, version control | Fallback to LLM evaluation |

## 6.2 Performance Targets

| **Metric** | **Target** | **Current** | **Improvement** |
|---|---|---|---|
| **PR Analysis Latency (end-to-end)** | <10 seconds | ~2 seconds (Phase 8) | 5x slower but worth it for accuracy |
| **False Positive Rate** | <5% | ~8% (Phase 8) | 37% reduction |
| **Patch Auto-Fix Success Rate** | >80% | N/A (new feature) | New KPI |
| **Compiled Policy Execution** | <50ms | N/A (new) | Sub-deterministic speed |

---

# 📝 Summary & Next Steps

**Phase 9 transforms Zaxion into a true AI co-engineering platform:**

1. **Pillar 1:** Natural language policies evaluated by Claude
2. **Pillar 2:** Repo-wide context injected into evaluations (RAG)
3. **Pillar 3:** Patches tested and validated before showing to users
4. **Pillar 4:** Compiled policies for speed without engineering overhead

**Growth Impact:**
- **"Public Flex":** Zaxion generates AND validates patches → viral (Pillar 3)
- **"Enterprise Moat":** Custom policies per org, repository awareness (Pillar 1+2)
- **"Performance Moat":** Compiled policies scale without LLM cost (Pillar 4)

**Next Step:** Approve Phase 9.1 implementation. We can ship Pillar 1 in 2 weeks and start getting user feedback.

---

**End of Document**
