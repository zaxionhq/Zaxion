import crypto from 'crypto';
import logger from '../logger.js';

/**
 * Phase 5 Pillar 3: Evaluation Engine (The Judge)
 * A pure, deterministic engine that evaluates Facts against Policies.
 */
export class EvaluationEngineService {
  constructor() {
    this.ENGINE_VERSION = '1.0.0';
    // Registry of deterministic checkers
    this.checkers = new Map([
      ['coverage', this._checkCoverage.bind(this)],
      ['security_path', this._checkSecurityPath.bind(this)],
      ['file_extension', this._checkFileExtension.bind(this)],
      ['pr_size', this._checkPRSize.bind(this)]
    ]);
  }

  /**
   * Pure evaluation function: Evaluation(Facts, Policies, EngineVersion) -> Outcome
   * Invariant 1: Strict Determinism
   * Invariant 7: Closed-World Evaluation
   * 
   * @param {object} factSnapshot - The frozen facts from Pillar 5.1
   * @param {object[]} appliedPolicies - The resolved policies from Pillar 5.2
   * @returns {object} Evaluation Result
   */
  evaluate(factSnapshot, appliedPolicies) {
    const startTime = new Date();
    const factData = factSnapshot.data;
    const violatedPolicies = [];
    const policyResults = [];

    logger.info({ 
      snapshotId: factSnapshot.id, 
      policyCount: appliedPolicies.length,
      engineVersion: this.ENGINE_VERSION 
    }, "EvaluationEngine: Starting deterministic evaluation");

    // 1. Execute Checkers for each applied policy
    for (const policy of appliedPolicies) {
      const rules = policy.rules_logic || {};
      const policyType = rules.type || 'unknown';
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
        details: result.details // Specifics like expected/actual
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

    // 2. Outcome Aggregator (Invariant 6 & Step 3.2)
    let finalResult = 'PASS';
    if (policyResults.some(p => p.verdict === 'BLOCK' && p.level === 'MANDATORY')) {
      finalResult = 'BLOCK';
    } else if (policyResults.some(p => p.verdict === 'BLOCK' || p.verdict === 'WARN')) {
      // If an OVERRIDABLE policy blocks, it becomes a final result of BLOCK 
      // unless specifically downgraded in future steps (not the Judge's job).
      // Design Step 3.2 says: If any MANDATORY returns BLOCK -> BLOCK. 
      // Else if any policy returns WARN -> WARN.
      const hasBlock = policyResults.some(p => p.verdict === 'BLOCK');
      finalResult = hasBlock ? 'BLOCK' : 'WARN';
    }

    // 3. Rationale Generator (Step 3.3)
    const rationale = this._generateRationale(finalResult, policyResults);

    // 4. Evaluation Hash (Invariant 1)
    const evaluationHash = this._calculateHash(factSnapshot, appliedPolicies);

    return {
      fact_snapshot_id: factSnapshot.id,
      applied_policies: appliedPolicies.map(p => ({
        policy_version_id: p.policy_version_id,
        level: p.level,
        policy_type: p.rules_logic?.type,
        parameters: p.rules_logic,
        resolution_reason: p.reason
      })),
      result: finalResult,
      rationale,
      violated_policies: violatedPolicies,
      evaluation_hash: evaluationHash,
      engine_version: this.ENGINE_VERSION,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Checker: Coverage
   * Checks if changed files have corresponding tests.
   */
  _checkCoverage(facts, rules) {
    const testFilesCount = facts.metadata.test_files_changed_count || 0;
    const minTests = rules.min_tests || 1;

    if (testFilesCount < minTests) {
      return {
        verdict: 'BLOCK',
        message: `Required at least ${minTests} test file(s), but found ${testFilesCount}.`,
        details: {
          fact_path: 'metadata.test_files_changed_count',
          expected: `>= ${minTests}`,
          actual: `${testFilesCount}`
        }
      };
    }
    return { verdict: 'PASS', message: 'Coverage requirements met.' };
  }

  /**
   * Checker: PR Size
   * Checks total changed files against a threshold.
   */
  _checkPRSize(facts, rules) {
    const totalFiles = facts.changes.total_files || 0;
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
  _checkSecurityPath(facts, rules) {
    const securityPaths = rules.security_paths || ['auth/', 'config/'];
    const changedPaths = facts.changes.files.map(f => f.path);
    
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

    const files = facts.changes.files;
    const invalidFiles = files.filter(f => !allowed.includes(f.extension));

    if (invalidFiles.length > 0) {
      const invalidExts = [...new Set(invalidFiles.map(f => f.extension))];
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
