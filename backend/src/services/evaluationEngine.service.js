import crypto from 'crypto';
import { minimatch } from 'minimatch';
import { buildImportGraph, findCircularDependencies } from './astAnalyzer.service.js';
import logger from '../logger.js';
import { PatternMatcherService } from './patternMatcher.service.js';
import { ComplexityMetricsService } from './complexityMetrics.service.js';
import { DependencyScannerService } from './dependencyScanner.service.js';

/** Documentation base (production). */
const DOCS_BASE = 'https://zaxion.dev/docs';

/** Per-rule explanations and remediation for simulation results (spec-aligned). */
const RULE_REMEDIATIONS = new Map([
  ['coverage', {
    explanation: 'Code changes should include or update tests. Without test coverage, regressions are harder to catch before merge.',
    remediation: {
      steps: [
        'Add or update unit tests for changed code.',
        'Ensure all branches and edge cases are covered.',
        'Run the test suite locally: e.g. npm test -- --coverage',
      ],
      example: "describe('myModule', () => {\n  it('should behave as expected', () => {\n    expect(myFn()).toEqual(expected);\n  });\n});",
    },
    documentation_link: `${DOCS_BASE}/policies`,
  }],
  ['security_path', {
    explanation: 'Changes to security-sensitive paths (e.g. auth, config) require extra scrutiny. Unauthorized changes can introduce vulnerabilities.',
    remediation: {
      steps: [
        'Restrict changes to these paths to authorized owners or use a separate approval workflow.',
        'Ensure secrets and auth logic are not exposed or weakened.',
      ],
      example: 'Move non-sensitive code out of auth/ or request an exception with justification.',
    },
    documentation_link: `${DOCS_BASE}/rules`,
  }],
  ['file_extension', {
    explanation: 'This policy restricts which file types may be changed to keep the codebase consistent and safe.',
    remediation: {
      steps: [
        'Only change files with allowed extensions, or request a policy update.',
        'If the extension is correct, add it to the policy allowed_extensions list.',
      ],
      example: 'Use .ts instead of .js if TypeScript is required, or update the policy to allow the extension.',
    },
    documentation_link: `${DOCS_BASE}/rules`,
  }],
  ['pr_size', {
    explanation: 'Very large PRs are hard to review and increase the risk of bugs. Splitting changes helps reviewers and keeps history clear.',
    remediation: {
      steps: [
        'Split the PR into smaller, focused changes.',
        'Use feature flags or follow-up PRs for non-essential changes.',
      ],
      example: 'Aim for under 20 files per PR when possible; use multiple PRs for large refactors.',
    },
    documentation_link: `${DOCS_BASE}/policies`,
  }],
  ['security_patterns', {
    explanation: 'Code may contain hardcoded secrets, passwords, API keys, or unsafe patterns like eval() that can lead to critical vulnerabilities.',
    remediation: {
      steps: [
        'Remove hardcoded credentials/secrets; use environment variables or a secrets manager.',
        'Avoid eval() and similar dynamic code execution; use safer alternatives.',
        'Sanitize user input before rendering to prevent XSS.',
      ],
      example: "// Use env: process.env.API_KEY\n//",
    },
    documentation_link: `${DOCS_BASE}/rules`,
  }],
  ['no-hardcoded-secrets', {
    explanation: 'Hardcoded secrets (API keys, tokens, credentials) in source code are a major security risk as they can be easily discovered and exploited.',
    remediation: {
      steps: [
        'Remove the hardcoded secret immediately.',
        'Rotate the compromised credential if it was already committed.',
        'Use environment variables or a dedicated secrets management system.',
      ],
      example: "const apiKey = process.env.API_KEY;",
    },
    documentation_link: `${DOCS_BASE}/rules`,
  }],
  ['no-console-logs-production', {
    explanation: 'Console logs and debugger statements should not be committed; they can leak information and block execution.',
    remediation: {
      steps: ['Remove logging statements before committing.', 'Use a proper logger or remove in production builds.'],
      example: "// Use: logger.debug('message') or remove entirely",
    },
    documentation_link: `${DOCS_BASE}/rules`,
  }],
  ['code_quality', {
    explanation: 'General code quality issues detected. Console logs and debugger statements should not be committed.',
    remediation: {
      steps: ['Remove logging statements before committing.', 'Use a proper logger or remove in production builds.'],
      example: "// Use: logger.debug('message') or remove entirely",
    },
    documentation_link: `${DOCS_BASE}/rules`,
  }],
  ['documentation', {
    explanation: 'Exported functions and public APIs should have JSDoc comments for maintainability and IDE support.',
    remediation: {
      steps: ['Add JSDoc comments above exported functions.', 'Include @param, @returns, and a brief description.'],
      example: '/**\\n * Computes the result.\\n * @param {number} x - Input\\n * @returns {number}\\n */',
    },
    documentation_link: `${DOCS_BASE}/rules`,
  }],
  ['architecture', {
    explanation: 'Circular dependencies make code hard to maintain and can cause runtime errors.',
    remediation: {
      steps: ['Break the cycle by extracting shared code to a separate module.', 'Restructure layers so dependencies flow in one direction.'],
      example: 'A -> B -> C -> A should become A -> common, B -> common, C -> common',
    },
    documentation_link: `${DOCS_BASE}/rules`,
  }],
  ['reliability', {
    explanation: 'Async code and operations that can throw should have proper error handling.',
    remediation: {
      steps: ['Wrap async operations in try/catch or use .catch().', 'Handle and log errors appropriately.'],
      example: "try { await risky(); } catch (e) { logger.error(e); throw e; }",
    },
    documentation_link: `${DOCS_BASE}/rules`,
  }],
  ['performance', {
    explanation: 'Performance-critical paths should have corresponding performance or benchmark tests.',
    remediation: {
      steps: ['Add performance tests for critical paths.', 'Use benchmark suites (e.g. vitest bench, jest-bench).'],
      example: "describe.perf('critical path', () => { ... })",
    },
    documentation_link: `${DOCS_BASE}/rules`,
  }],
  ['api', {
    explanation: 'Breaking API changes should be avoided or explicitly versioned.',
    remediation: {
      steps: ['Avoid removing or changing public exports without a major version bump.', 'Document breaking changes.'],
      example: 'Deprecate first, then remove in next major',
    },
    documentation_link: `${DOCS_BASE}/rules`,
  }],
  ['testing_best_practices', {
    explanation: 'Skipped tests and empty test cases reduce the reliability of the test suite and provide a false sense of security.',
    remediation: {
      steps: [
        'Remove .skip, xit, or xdescribe markers from tests.',
        'Implement test logic and assertions for all test cases.',
        'If a test is no longer needed, remove it entirely rather than skipping.',
      ],
      example: "// Avoid: it.skip('should work', () => {})\n// Use: it('should work', () => { expect(actual).toBe(expected); })",
    },
    documentation_link: `${DOCS_BASE}/policies`,
  }],
]);

/** Security pattern definitions: { pattern: RegExp, message: string, severity: 'BLOCK'|'WARN' } */
const SECURITY_PATTERNS = [
  { pattern: /(?:[p]assword|[p]asswd|[p]wd)\s*=\s*["'][^"']+["']/gi, message: 'Possible hardcoded credential', severity: 'BLOCK' },
  { pattern: /(?:api[_-]?key|apikey)\s*=\s*["'][^"']+["']/gi, message: 'Possible hardcoded API key', severity: 'BLOCK' },
  { pattern: /(?:secret|token)\s*=\s*["'][^"']{8,}["']/gi, message: 'Possible hardcoded secret or token', severity: 'BLOCK' },
  { pattern: /\beval\s*\(/g, message: 'Use of eval() is unsafe', severity: 'BLOCK' },
  { pattern: /new\s+Function\s*\(/g, message: 'Dynamic code execution (new Function) is risky', severity: 'WARN' },
  { pattern: /\.innerHTML\s*=/g, message: 'Direct innerHTML assignment can cause XSS', severity: 'WARN' },
  { pattern: /dangerouslySetInnerHTML/g, message: 'Ensure content is sanitized when using dangerouslySetInnerHTML', severity: 'OBSERVE' },
];

/**
 * Phase 5 Pillar 3: Evaluation Engine (The Judge)
 * A pure, deterministic engine that evaluates Facts against Policies.
 */
export class EvaluationEngineService {
  constructor() {
    this.ENGINE_VERSION = '1.0.0';
    this.patternMatcher = new PatternMatcherService();
    this.complexityMetrics = new ComplexityMetricsService();
    this.dependencyScanner = new DependencyScannerService();
    // Registry of deterministic checkers
    this.checkers = new Map([
      ['coverage', this._checkCoverage.bind(this)],
      ['security_path', this._checkSecurityPath.bind(this)],
      ['file_extension', this._checkFileExtension.bind(this)],
      ['pr_size', this._checkPRSize.bind(this)],
      ['security_patterns', this._checkSecurityPatterns.bind(this)],
      ['complexity_metrics', this._checkComplexityMetrics.bind(this)],
      ['dependency_scan', this._checkDependencyScan.bind(this)],
      ['code_quality', this._checkCodeQuality.bind(this)],
      ['documentation', this._checkDocumentation.bind(this)],
      ['architecture', this._checkArchitecture.bind(this)],
      ['reliability', this._checkReliability.bind(this)],
      ['performance', this._checkPerformance.bind(this)],
      ['api', this._checkApi.bind(this)],
      ['testing_best_practices', this._checkTestingBestPractices.bind(this)],
    ]);
  }

  /**
   * Wave 4: Requirements Detection
   * Determines if a set of policies requires file content or AST data for evaluation.
   */
  getRequiredDataDepth(appliedPolicies) {
    let requiresContent = false;
    let requiresAst = false;

    for (const policy of appliedPolicies) {
      const type = policy.rules_logic?.type;
      if (!type) continue;

      if ([
        'security_patterns', 'code_quality', 'complexity_metrics', 
        'dependency_scan', 'reliability'
      ].includes(type)) {
        requiresContent = true;
      }

      if ([
        'documentation', 'architecture', 'testing_best_practices', 'coverage'
      ].includes(type)) {
        requiresAst = true;
      }
    }

    return { requiresContent, requiresAst };
  }

  /** Priority order for resolving policy conflicts (Higher value = Higher priority) */
  static POLICY_PRIORITY = new Map([
    ['security_patterns', 100],
    ['api', 90],
    ['architecture', 80],
    ['testing_best_practices', 70],
    ['complexity_metrics', 60],
    ['documentation', 50],
    ['performance', 40],
    ['code_quality', 30],
  ]);

  /**
   * Evaluate a Fact Snapshot against applied policies
   * @param {object} factSnapshot - The fact snapshot to evaluate
   * @param {Array} appliedPolicies - The policies to apply
   * @returns {object} Evaluation Result
   */
  evaluate(factSnapshot, appliedPolicies) {
    const factData = factSnapshot?.data ?? {};
    const violatedPolicies = [];
    const policyResults = [];

    // 1. Detect Escape Hatches (@zaxion-bypass)
    const bypassMap = this._detectBypasses(factData);

    logger.info({ 
      snapshotId: factSnapshot.id, 
      policyCount: appliedPolicies.length,
      engineVersion: this.ENGINE_VERSION,
      bypassesDetected: bypassMap.size
    }, "EvaluationEngine: Starting deterministic evaluation");

    // 2. Sort policies by priority for conflict resolution
    const sortedPolicies = [...appliedPolicies].sort((a, b) => {
      const pA = EvaluationEngineService.POLICY_PRIORITY.get(a.rules_logic?.type) || 0;
      const pB = EvaluationEngineService.POLICY_PRIORITY.get(b.rules_logic?.type) || 0;
      return pB - pA;
    });

    // 3. Execute Checkers for each applied policy
    for (const policy of sortedPolicies) {
      const rules = policy.rules_logic || {};
      const policyType = rules.type || 'unknown';

      // Check for escape hatch bypass
      if (bypassMap.has(policyType)) {
        logger.info({ policyType, reason: bypassMap.get(policyType) }, "EvaluationEngine: Policy bypassed via escape hatch");
        policyResults.push({
          policy_version_id: policy.policy_version_id,
          level: policy.level,
          policy_type: policyType,
          verdict: 'PASS',
          message: `Bypassed via escape hatch: ${bypassMap.get(policyType)}`,
          details: { bypassed: true, reason: bypassMap.get(policyType) }
        });
        continue;
      }

      const checker = this.checkers.get(policyType);
      let result = { verdict: 'PASS', message: 'Policy satisfied.' };

      if (checker) {
        result = checker(factData, rules);
      } else {
        logger.warn({ policyType, policyId: policy.policy_id }, "EvaluationEngine: No checker found for policy type");
      }

      const policyResult = {
        policy_version_id: policy.policy_version_id,
        level: policy.level,
        policy_type: policyType,
        verdict: result.verdict,
        message: result.message,
        details: result.details
      };

      policyResults.push(policyResult);

      if (result.verdict !== 'PASS') {
        violatedPolicies.push({
          policy_version_id: policy.policy_version_id,
          checker: policyType,
          ...result.details,
          message: result.message
        });
      }
    }

    // 4. Outcome Aggregator (Invariant 6 & Step 3.2)
    let finalResult = 'PASS';
    if (policyResults.some(p => p.verdict === 'BLOCK' && p.level === 'MANDATORY')) {
      finalResult = 'BLOCK';
    } else if (policyResults.some(p => p.verdict === 'BLOCK' || p.verdict === 'WARN')) {
      const hasBlock = policyResults.some(p => p.verdict === 'BLOCK');
      finalResult = hasBlock ? 'BLOCK' : 'WARN';
    } else if (policyResults.some(p => p.verdict === 'OBSERVE')) {
      finalResult = 'OBSERVE';
    }

    // 5. Rationale Generator (Step 3.3)
    const rationale = this._generateRationale(finalResult, policyResults);

    // 6. Structured violations/passes for simulation UI (spec-aligned)
    const structuredViolations = [];
    const structuredPasses = [];
    const files = factData?.changes?.files || [];
    for (const pr of policyResults) {
      const ruleId = pr.policy_type;
      
      if (pr.verdict !== 'PASS') {
        const details = violatedPolicies.find(v => v.checker === ruleId) || {};
        let file = factData?.file_path || null;
        if (!file && details.actual && typeof details.actual === 'string' && details.actual.includes(',')) {
          file = details.actual.split(',')[0].trim();
        } else if (!file && details.actual) {
          file = details.actual;
        } else if (!file && files.length > 0) {
          file = files.map(f => f.path || f).join(', ');
        }
        const subViolations = details.violations || [];
        if (subViolations.length > 0) {
          for (const sv of subViolations) {
            // Wave 4 Enhancement: Dynamic meta lookup per sub-violation (pattern)
            const meta = (sv.policy && RULE_REMEDIATIONS.get(sv.policy)) || RULE_REMEDIATIONS.get(ruleId) || {
              explanation: 'Rule failed.',
              remediation: { steps: ['Review the policy and fix the reported issue.'], example: '' },
              documentation_link: DOCS_BASE,
            };

            structuredViolations.push({
              rule_id: ruleId,
              severity: sv.severity || pr.verdict,
              message: sv.message || pr.message,
              file: sv.file || file || undefined,
              line: sv.line,
              column: sv.column,
              current_value: details.actual,
              required_value: details.expected,
              explanation: meta.explanation,
              remediation: meta.remediation,
              documentation_link: meta.documentation_link,
            });
          }
        } else {
          const meta = RULE_REMEDIATIONS.get(ruleId) || {
            explanation: 'Rule failed.',
            remediation: { steps: ['Review the policy and fix the reported issue.'], example: '' },
            documentation_link: DOCS_BASE,
          };
          structuredViolations.push({
            rule_id: ruleId,
            severity: pr.verdict,
            message: pr.message,
            file: file || undefined,
            current_value: details.actual,
            required_value: details.expected,
            explanation: meta.explanation,
            remediation: meta.remediation,
            documentation_link: meta.documentation_link,
          });
        }
      } else {
        structuredPasses.push({ rule_id: ruleId, message: pr.message });
      }
    }

    return {
      result: finalResult, // Alias for backward compatibility / tests
      final_verdict: finalResult,
      rationale,
      policy_results: policyResults,
      violations: structuredViolations,
      violated_policies: structuredViolations.map(v => ({
        ...v,
        expected: v.required_value,
        actual: v.current_value
      })), // Alias for tests
      passes: structuredPasses,
      evaluation_hash: this._calculateHash(factSnapshot, appliedPolicies),
      metadata: {
        evaluated_at: new Date().toISOString(),
        engine_version: this.ENGINE_VERSION,
        policy_count: appliedPolicies.length,
        bypasses: Array.from(bypassMap.keys()),
      },
    };
  }

  /**
   * Scan for escape hatches in the code.
   * Format: // @zaxion-bypass: <policy-type> [reason]
   */
  _detectBypasses(factData) {
    const bypassMap = new Map();
    const files = factData.changes?.files || [];
    const content = factData.file_content || '';

    const scanContent = (text) => {
      const lines = text.split('\n');
      for (const line of lines) {
        const match = line.match(/\/\/ @zaxion-bypass:\s*([a-zA-Z0-9_-]+)\s*(.*)/);
        if (match) {
          bypassMap.set(match[1], match[2] || 'No reason provided');
        }
      }
    };

    if (content) scanContent(content);
    for (const f of files) {
      if (f.content) scanContent(f.content);
    }

    return bypassMap;
  }

  /**
   * Checker: Coverage
   * Uses AST-derived coverage ratio when available (min_coverage_ratio), else test file count (min_tests).
   */
  _checkCoverage(facts, rules) {
    const minCoverageRatio = rules.min_coverage_ratio;
    const astRatio = facts.metadata?.ast_coverage_ratio;
    const astFunctionCount = facts.metadata?.ast_function_count ?? 0;
    const astTestCount = facts.metadata?.ast_test_count ?? 0;

    if (minCoverageRatio != null && typeof minCoverageRatio === 'number') {
      if (astFunctionCount === 0 && astTestCount === 0) {
        return { verdict: 'PASS', message: 'No source functions to cover.' };
      }
      const ratio = astRatio ?? 0;
      if (ratio < minCoverageRatio) {
        return {
          verdict: 'BLOCK',
          message: `Test coverage ratio ${(ratio * 100).toFixed(1)}% is below required ${(minCoverageRatio * 100).toFixed(0)}%.`,
          details: {
            fact_path: 'metadata.ast_coverage_ratio',
            expected: `>= ${(minCoverageRatio * 100).toFixed(0)}%`,
            actual: `${(ratio * 100).toFixed(1)}% (${astTestCount} tests / ${astFunctionCount} functions)`,
          },
        };
      }
      return { verdict: 'PASS', message: 'Coverage ratio requirements met.' };
    }

    const testFilesCount = facts.metadata?.test_files_changed_count || 0;
    const minTests = rules.min_tests ?? 1;
    if (testFilesCount < minTests) {
      return {
        verdict: 'BLOCK',
        message: `Required at least ${minTests} test file(s), but found ${testFilesCount}.`,
        details: {
          fact_path: 'metadata.test_files_changed_count',
          expected: `>= ${minTests}`,
          actual: `${testFilesCount}`,
        },
      };
    }
    return { verdict: 'PASS', message: 'Coverage requirements met.' };
  }

  /**
   * Checker: PR Size
   * Checks total changed files against a threshold.
   */
  _checkPRSize(facts, rules) {
    const totalFiles = facts.changes?.total_files || 0;
    const maxFiles = rules.max_files || 20;

    if (totalFiles > maxFiles) {
      return {
        verdict: 'WARN',
        message: `PR is large (${totalFiles} files). Recommended maximum is ${maxFiles}.`,
        details: {
          fact_path: 'changes.total_files',
          expected: `<= ${maxFiles}`,
          actual: `${totalFiles}`
        }
      };
    }
    return { verdict: 'PASS', message: 'PR size is within limits.' };
  }

  /**
   * Checker: Security Path
   * Checks if changes in security paths are allowed.
   */
  /**
   * Get file list filtered by optional rule pattern (glob, e.g. "src/auth/**").
   */
  _getApplicableFiles(facts, pattern) {
    const files = facts.changes?.files || [];
    if (!pattern || typeof pattern !== 'string') return files;
    return files.filter(f => {
      const path = typeof f === 'string' ? f : (f.path || '');
      return path && minimatch(path, pattern, { matchBase: true });
    });
  }

  _checkSecurityPath(facts, rules) {
    const securityPaths = rules.security_paths || ['auth/', 'config/'];
    const files = this._getApplicableFiles(facts, rules.pattern);
    const changedPaths = files.map(f => (typeof f === 'string' ? f : f.path)).filter(Boolean);
    if (changedPaths.length === 0) return { verdict: 'PASS', message: 'No file paths to check.' };

    const violations = changedPaths.filter(cp =>
      securityPaths.some(sp => cp.startsWith(sp))
    );

    if (violations.length > 0) {
      return {
        verdict: 'BLOCK',
        message: `Unauthorized changes to security-sensitive paths: ${violations.join(', ')}`,
        details: {
          fact_path: 'changes.files.path',
          expected: 'No changes to security paths',
          actual: violations.join(', ')
        }
      };
    }
    return { verdict: 'PASS', message: 'No security path violations.' };
  }

  /**
   * Checker: File Extension
   * Restricts allowed file extensions.
   */
  _checkFileExtension(facts, rules) {
    const allowed = rules.allowed_extensions || [];
    if (allowed.length === 0) return { verdict: 'PASS', message: 'All extensions allowed.' };

    const files = this._getApplicableFiles(facts, rules.pattern);
    const ext = (f) => (typeof f === 'string' ? '' : (f.extension || ''));
    const invalidFiles = files.filter(f => !allowed.includes(ext(f)));

    if (invalidFiles.length > 0) {
      const invalidExts = [...new Set(invalidFiles.map(f => ext(f)).filter(Boolean))];
      return {
        verdict: 'BLOCK',
        message: `Forbidden file extensions found: ${invalidExts.join(', ')}`,
        details: {
          fact_path: 'changes.files.extension',
          expected: `One of: ${allowed.join(', ')}`,
          actual: invalidExts.join(', ')
        }
      };
    }
    return { verdict: 'PASS', message: 'File extensions are valid.' };
  }

  /**
   * Security pattern checker: scans all file content for secrets, eval(), XSS patterns using PatternMatcherService.
   * Returns violations with line numbers and file path.
   */
  _checkSecurityPatterns(facts, rules) {
    const files = facts.changes?.files || [];
    const singleContent = facts.file_content;
    const toScan = files.filter(f => f.content).length
      ? files
      : singleContent ? [{ path: facts.file_path || 'file', content: singleContent }] : [];
    if (!toScan.length) return { verdict: 'PASS', message: 'No file content to scan.' };

    const violations = [];
    for (const file of toScan) {
      const content = typeof file.content === 'string' ? file.content : '';
      const path = file.path || file.filePath || 'file';
      
      // Use PatternMatcherService
      const matches = this.patternMatcher.analyzeCode(content, path);
      violations.push(...matches);
    }

    if (violations.length === 0) return { verdict: 'PASS', message: 'No security patterns detected.' };
    const hasBlock = violations.some(v => v.severity === 'BLOCK' || v.severity === 'HIGH');
    const hasWarn = violations.some(v => v.severity === 'WARN' || v.severity === 'MEDIUM');
    const verdict = hasBlock ? 'BLOCK' : hasWarn ? 'WARN' : 'OBSERVE';
    const summary = violations.slice(0, 5).map(v => `${v.file}:${v.line} [${v.policy}] ${v.pattern}`).join('; ');
    return {
      verdict,
      message: `${violations.length} security pattern(s) found. ${summary}${violations.length > 5 ? '...' : ''}`,
      details: {
        fact_path: 'file_content',
        expected: 'No hardcoded secrets or unsafe patterns',
        actual: summary,
        violations: violations.map(v => ({
            line: v.line,
            column: v.column,
            message: v.pattern, // Mapping pattern name to message for UI
            severity: v.severity === 'HIGH' ? 'BLOCK' : (v.severity === 'MEDIUM' ? 'WARN' : 'INFO'),
            file: v.file,
            code: v.code,
            policy: v.policy // Wave 4: Pass through specific policy name for UI meta lookup
        })),
      },
    };
  }

  /**
   * Complexity metrics checker: uses ComplexityMetricsService.
   */
  _checkComplexityMetrics(facts, rules) {
    const files = facts.changes?.files || [];
    const singleContent = facts.file_content;
    const toScan = files.filter(f => f.content).length
      ? files
      : singleContent ? [{ path: facts.file_path || 'file', content: singleContent }] : [];
    
    if (!toScan.length) return { verdict: 'PASS', message: 'No file content to scan for complexity.' };

    const violations = [];
    for (const file of toScan) {
        const content = typeof file.content === 'string' ? file.content : '';
        const path = file.path || file.filePath || 'file';
        const fileViolations = this.complexityMetrics.analyzeCode(content, path);
        violations.push(...fileViolations);
    }

    if (violations.length === 0) return { verdict: 'PASS', message: 'No complexity issues detected.' };

    const hasBlock = violations.some(v => v.severity === 'HIGH' || v.severity === 'BLOCK');
    return {
        verdict: hasBlock ? 'BLOCK' : 'WARN',
        message: `${violations.length} complexity issue(s) found.`,
        details: {
            fact_path: 'complexity_metrics',
            expected: 'Code within complexity limits',
            actual: violations.length,
            violations: violations.map(v => ({
                line: v.line,
                file: v.file,
                message: v.message,
                severity: v.severity === 'HIGH' ? 'BLOCK' : 'WARN'
            }))
        }
    };
  }

  /**
   * Dependency scanner checker: scans package.json
   */
  async _checkDependencyScan(facts, rules) {
    const files = facts.changes?.files || [];
    // Handle both single file_content and files array
    const singleContent = facts.file_content;
    const packageJsonFiles = files.filter(f => f.path && f.path.endsWith('package.json'));
    
    // Avoid duplication if single file is already in files array
    if (singleContent && facts.file_path && facts.file_path.endsWith('package.json')) {
        const alreadyExists = packageJsonFiles.some(f => f.path === facts.file_path);
        if (!alreadyExists) {
            packageJsonFiles.push({ path: facts.file_path, content: singleContent });
        }
    }
    
    if (!packageJsonFiles.length) return { verdict: 'PASS', message: 'No package.json changes detected.' };

    const violations = [];
    for (const file of packageJsonFiles) {
        const content = typeof file.content === 'string' ? file.content : '';
        const path = file.path || 'package.json';
        const fileViolations = await this.dependencyScanner.scanPackageJson(content, path);
        violations.push(...fileViolations);
    }

    if (violations.length === 0) return { verdict: 'PASS', message: 'No vulnerable dependencies detected.' };

    return {
        verdict: 'BLOCK', // Usually dependencies are critical
        message: `${violations.length} vulnerable dependency(ies) found.`,
        details: {
            fact_path: 'dependency_scan',
            expected: 'No vulnerable dependencies',
            actual: violations.length,
            violations: violations
        }
    };
  }

  /**
   * Code quality checker: uses PatternMatcherService for console logs, debugging etc.
   */
  _checkCodeQuality(facts, rules) {
    const files = facts.changes?.files || [];
    const singleContent = facts.file_content;
    const toScan = files.filter(f => f.content).length
      ? files
      : singleContent ? [{ path: facts.file_path || 'file', content: singleContent, ast: null }] : [];
    
    // We can reuse PatternMatcherService here too if we define the patterns in yaml
    // For now, let's keep the existing logic OR switch to PatternMatcher if we added console-logs patterns.
    // We DID add no-console-logs-production to yaml.
    
    const violations = [];
    for (const file of toScan) {
      const content = typeof file.content === 'string' ? file.content : '';
      const path = file.path || file.filePath || 'file';
      
      // Use PatternMatcherService for code quality patterns
      // Note: analyzeCode runs ALL enabled patterns. 
      // Ideally we would want to run only specific patterns.
      // But running all is fine, we just filter the results for the current checker.
      
      const allMatches = this.patternMatcher.analyzeCode(content, path);
      
      // Filter for code quality policies
      const qualityMatches = allMatches.filter(m => 
          m.policy === 'no-console-logs-production' || 
          m.policy === 'no-magic-numbers' || 
          m.policy === 'no-deprecated-apis' ||
          m.policy === 'no-debug-mode-production'
      );
      
      violations.push(...qualityMatches);
    }

    if (violations.length === 0) return { verdict: 'PASS', message: 'No code quality issues detected.' };
    
    const hasBlock = violations.some(v => v.severity === 'HIGH' || v.severity === 'BLOCK');
    return {
      verdict: hasBlock ? 'BLOCK' : 'WARN',
      message: violations.map(v => `${v.file}: ${v.pattern}`).join('; '),
      details: { 
          fact_path: 'code_quality', 
          expected: 'Clean code', 
          actual: violations.length, 
          violations: violations.map(v => ({
            line: v.line,
            file: v.file,
            message: v.pattern,
            severity: v.severity === 'HIGH' ? 'BLOCK' : 'WARN',
            policy: v.policy // Wave 4: Pass through specific policy name for UI meta lookup
          })) 
      },
    };
  }

  _checkDocumentation(facts, rules) {
    const requireJSDoc = rules.require_jsdoc_on_exports !== false;
    if (!requireJSDoc) return { verdict: 'PASS', message: 'JSDoc not required.' };
    
    // Security: Use Map for safe lookup
    const astByPath = facts.metadata?.ast_by_path;
    if (!astByPath || typeof astByPath !== 'object') {
       return { verdict: 'PASS', message: 'No AST data available.' };
    }

    const astLookup = new Map(Object.entries(astByPath));
    const files = facts.changes?.files || [];
    const missing = [];
    for (const f of files) {
      const pathKey = f.path || f.filePath;
      if (!pathKey || !['.ts', '.tsx', '.js', '.jsx'].includes((f.extension || '').toLowerCase())) continue;
      
      const ast = f.ast || astLookup.get(pathKey);
      if (ast && ast.exports?.length && !ast.hasJSDocOnExport) missing.push(pathKey);
    }
    if (missing.length === 0) return { verdict: 'PASS', message: 'Exports have JSDoc where required.' };
    return {
      verdict: 'WARN',
      message: `Files with exports missing JSDoc: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`,
      details: { fact_path: 'documentation', expected: 'JSDoc on exports', actual: missing.join(', '), violations: missing.map(f => ({ file: f })) },
    };
  }

  _checkArchitecture(facts, rules) {
    const files = (facts.changes?.files || []).filter(f => f.content && ['.ts', '.tsx', '.js', '.jsx'].includes((f.extension || '').toLowerCase()));
    if (files.length < 2) return { verdict: 'PASS', message: 'Not enough files to check circular dependencies.' };
    const { edges } = buildImportGraph(files.map(f => ({ path: f.path || f.filePath, content: f.content })));
    const cycles = findCircularDependencies(edges);
    if (cycles.length === 0) return { verdict: 'PASS', message: 'No circular dependencies detected.' };
    const summary = cycles[0].join(' -> ');
    return {
      verdict: 'BLOCK',
      message: `Circular dependency detected: ${summary}`,
      details: { fact_path: 'architecture', expected: 'No circular imports', actual: summary, violations: cycles.map(c => ({ cycle: c })) },
    };
  }

  _checkReliability(facts, rules) {
    const files = facts.changes?.files || [];
    const singleContent = facts.file_content;
    const toScan = files.filter(f => f.content).length ? files : singleContent ? [{ path: 'file', content: singleContent }] : [];
    const violations = [];
    for (const file of toScan) {
      const content = typeof file.content === 'string' ? file.content : '';
      const path = file.path || file.filePath || 'file';
      if (/await\s+[^;]+(?!\s*catch)/m.test(content) && !/try\s*\{[\s\S]*await/m.test(content) && !/\.catch\s*\(/m.test(content)) {
        if (/await\s+/m.test(content)) violations.push({ file: path, message: 'await without try/catch or .catch' });
      }
    }
    if (violations.length === 0) return { verdict: 'PASS', message: 'Async code appears to have error handling.' };
    return {
      verdict: 'WARN',
      message: violations.map(v => `${v.file}: ${v.message}`).join('; '),
      details: { fact_path: 'reliability', expected: 'Error handling for async', actual: violations.length, violations },
    };
  }

  _checkPerformance(facts, rules) {
    const requirePerfTests = rules.require_performance_tests === true;
    if (!requirePerfTests) return { verdict: 'PASS', message: 'Performance tests not required.' };
    const files = facts.changes?.files || [];
    const testFiles = files.filter(f => f.is_test_file || /\.(perf|bench|performance)\.(ts|js)/.test(f.path || ''));
    const hasPerf = testFiles.some(f => {
      const c = f.content || '';
      return /describe\.perf|it\.perf|benchmark|performance\.now|vitest\.bench|jest\.bench/i.test(c);
    });
    if (hasPerf) return { verdict: 'PASS', message: 'Performance tests found.' };
    const testCount = files.filter(f => f.is_test_file).length;
    if (testCount === 0) return { verdict: 'OBSERVE', message: 'No test files to check for performance tests.' };
    return {
      verdict: 'OBSERVE',
      message: 'No performance or benchmark tests detected in test files.',
      details: { fact_path: 'performance', expected: 'Performance tests for critical paths', actual: 'None found', violations: [] },
    };
  }

  _checkApi(facts, rules) {
    const disallowBreakingChanges = rules.disallow_breaking_changes === true;
    if (!disallowBreakingChanges) return { verdict: 'PASS', message: 'API breaking changes not checked.' };
    return { verdict: 'PASS', message: 'API compatibility check (no diff available in this context).' };
  }

  /**
   * Checker: Testing Best Practices (Wave 3)
   * Detects skipped tests and empty test cases via AST.
   */
  _checkTestingBestPractices(facts, rules) {
    const astByPathMap = new Map(Object.entries(facts.metadata?.ast_by_path || {}));
    const violations = [];
    
    for (const [path, ast] of astByPathMap.entries()) {
      if (ast.hasSkippedTest) {
        violations.push({
          policy: 'no-skipped-tests',
          severity: 'HIGH',
          message: `Skipped test found in ${path}. Use of .skip or xit is blocked.`,
          file: path,
          line: 1
        });
      }
      if (ast.hasEmptyTest) {
        violations.push({
          policy: 'no-empty-test-suites',
          severity: 'MEDIUM',
          message: `Empty test case found in ${path}. All tests must have implementation and assertions.`,
          file: path,
          line: 1
        });
      }
    }

    if (violations.length === 0) return { verdict: 'PASS', message: 'Testing best practices followed.' };

    const hasHigh = violations.some(v => v.severity === 'HIGH');
    return {
      verdict: hasHigh ? 'BLOCK' : 'WARN',
      message: `${violations.length} testing violation(s) found.`,
      details: {
        fact_path: 'metadata.ast_by_path',
        expected: 'No skipped or empty tests',
        actual: violations.length,
        violations: violations
      }
    };
  }

  _generateRationale(result, policyResults) {
    if (result === 'PASS') return 'All policies passed successfully.';

    const violations = policyResults.filter(p => p.verdict !== 'PASS');
    const summaries = violations.map(v => `[${v.level}] ${v.message}`);
    
    return `Evaluation Result: ${result}. Issues found:\n- ${summaries.join('\n- ')}`;
  }

  _calculateHash(facts, policies) {
    const input = JSON.stringify({
      facts: facts.data,
      policies: policies.map(p => ({ id: p.policy_version_id, rules: p.rules_logic })),
      version: this.ENGINE_VERSION
    });
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
