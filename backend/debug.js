import { EvaluationEngineService } from './src/services/evaluationEngine.service.js';
import * as codeAnalysis from './src/services/codeAnalysis.service.js';
import { FactIngestorService } from './src/services/factIngestor.service.js';

async function run() {
  const engine = new EvaluationEngineService();

  console.log("=== TEST: MIN TESTS ===");
  const minTestRules = { type: 'coverage', min_tests: 2 };

  // 1. Paste (1 test file)
  const pasteSnapshot = codeAnalysis.buildSyntheticSnapshot({
    content: "test('foo', () => {})",
    virtualPath: "test.js"
  });
  const pasteResult = engine.evaluate(pasteSnapshot, [{ rules_logic: minTestRules, level: 'MANDATORY', policy_version_id: '1' }]);
  console.log("Paste Min Tests:", pasteResult.result, pasteResult.violations.map(v=>v.message));

  // 2. PR URL (1 test file)
  const prSnapshot = codeAnalysis.buildSyntheticSnapshotFromZip([{
    path: "test.js",
    content: "test('foo', () => {})",
    extension: ".js"
  }]);
  const prResult = engine.evaluate(prSnapshot, [{ rules_logic: minTestRules, level: 'MANDATORY', policy_version_id: '1' }]);
  console.log("PR URL Min Tests:", prResult.result, prResult.violations.map(v=>v.message));

  // 3. Reposi (1 test file, no content)
  const reposiSnapshot = {
    data: {
      metadata: { test_files_changed_count: 1 }
    }
  };
  const reposiResult = engine.evaluate(reposiSnapshot, [{ rules_logic: minTestRules, level: 'MANDATORY', policy_version_id: '1' }]);
  console.log("Reposi Min Tests:", reposiResult.result, reposiResult.violations.map(v=>v.message));

  console.log("\n=== TEST: SECURITY PATTERNS ===");
  const secRules = { type: 'security_patterns' };

  // 1. Paste
  const pasteSecSnapshot = codeAnalysis.buildSyntheticSnapshot({
    content: "const apiKey = 'AKIAIOSFODNN7EXAMPLE';",
    virtualPath: "auth.js"
  });
  const pasteSecResult = engine.evaluate(pasteSecSnapshot, [{ rules_logic: secRules, level: 'MANDATORY', policy_version_id: '1' }]);
  console.log("Paste Security:", pasteSecResult.result, pasteSecResult.violations.map(v=>v.message));

  // 2. PR URL
  const prSecSnapshot = codeAnalysis.buildSyntheticSnapshotFromZip([{
    path: "auth.js",
    content: "const apiKey = 'AKIAIOSFODNN7EXAMPLE';",
    extension: ".js"
  }]);
  const prSecResult = engine.evaluate(prSecSnapshot, [{ rules_logic: secRules, level: 'MANDATORY', policy_version_id: '1' }]);
  console.log("PR URL Security:", prSecResult.result, prSecResult.violations.map(v=>v.message));
}

run().catch(console.error);
