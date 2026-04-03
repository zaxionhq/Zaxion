/**
 * Zaxion Policy Validation Suite (Golden Tests)
 * This script verifies that the Governance Engine correctly identifies
 * enterprise-level violations.
 */
import { EvaluationEngineService } from '../src/services/evaluationEngine.service.js';
import logger from '../src/logger.js';

async function runGoldenTests() {
  const engine = new EvaluationEngineService();
  
  const tests = [
    {
      name: "Secret Detection (Blocking)",
      facts: {
        changes: {
          files: [{
            path: "src/config.js",
            ast: {
              semanticFacts: {
                variableDeclarations: [
                  { name: "AWS_SECRET_KEY", value: "AKIAIOSFODNN7EXAMPLE", type: "StringLiteral", isConstant: true }
                ],
                functionCalls: [],
                templateLiterals: [],
                imports: [],
                assignments: []
              }
            }
          }]
        }
      },
      expectedVerdict: "BLOCK",
      expectedRule: "no_hardcoded_secrets"
    },
    {
      name: "Architectural Layer Violation (Blocking)",
      facts: {
        changes: {
          files: [{
            path: "src/services/userService.js",
            ast: {
              semanticFacts: {
                imports: [
                  { source: "../controllers/userController.js", specifiers: ["userController"] }
                ],
                variableDeclarations: [],
                functionCalls: [],
                templateLiterals: [],
                assignments: []
              }
            }
          }]
        }
      },
      expectedVerdict: "BLOCK",
      expectedRule: "architectural_integrity"
    },
    {
      name: "PII Logging Violation (Blocking)",
      facts: {
        changes: {
          files: [{
            path: "src/api/user.js",
            ast: {
              semanticFacts: {
                variableDeclarations: [
                  { name: "userEmail", value: "test@example.com", type: "StringLiteral" }
                ],
                functionCalls: [
                  { name: "console.log", arguments: ["userEmail"] }
                ],
                imports: [],
                templateLiterals: [],
                assignments: []
              }
            }
          }]
        }
      },
      expectedVerdict: "BLOCK",
      expectedRule: "data_privacy"
    },
    {
      name: "Institutional Style Violation (Warning)",
      facts: {
        changes: {
          files: [{
            path: "src/services/auth.js", // Missing "Service" suffix
            ast: { semanticFacts: { imports: [], variableDeclarations: [], functionCalls: [], templateLiterals: [], assignments: [] } }
          }]
        }
      },
      expectedVerdict: "WARN",
      expectedRule: "institutional_style"
    }
  ];

  logger.info("--- Starting Policy Validation (Golden Tests) ---");
  let passedTests = 0;

  for (const test of tests) {
    const result = engine.checkers.get(test.expectedRule)(test.facts, {});
    
    if (result.verdict === test.expectedVerdict) {
      logger.info(`✅ PASS: ${test.name}`);
      passedTests++;
    } else {
      logger.error(`❌ FAIL: ${test.name}`);
      logger.error(`   Expected: ${test.expectedVerdict}, Actual: ${result.verdict}`);
    }
  }

  logger.info(`--- Validation Complete: ${passedTests}/${tests.length} tests passed ---`);
  
  if (passedTests === tests.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runGoldenTests().catch(err => {
  logger.error("Validation Suite Error:", err);
  process.exit(1);
});
