import { PolicyEngineService } from "../src/services/policyEngine.service.js";
import logger from "../src/utils/logger.js";

// Mock Octokit for Override permissions check
const mockOctokit = {
  repos: {
    getCollaboratorPermissionLevel: async () => ({
      data: { permission: "admin" } // Simulate admin user
    })
  }
};

const policyEngine = new PolicyEngineService(mockOctokit);

async function runTests() {
  logger.info("🧪 Starting Policy Engine Tests...\n");

  const scenarios = [
    {
      name: "✅ 1. Simple Pass (No critical files)",
      prContext: {
        categories: { highRisk: [], tests: [], other: ["src/ui/Button.js"] },
        totalChanges: 1
      },
      metadata: { owner: "org", repo: "payments", prNumber: 1, baseBranch: "main" },
      expected: "PASS"
    },
    {
      name: "❌ 2. High Risk Block (Auth changed, no tests)",
      prContext: {
        categories: { highRisk: ["src/auth/login.js"], tests: [], other: [] },
        totalChanges: 1
      },
      metadata: { owner: "org", repo: "payments", prNumber: 2, baseBranch: "main" },
      expected: "BLOCK"
    },
    {
      name: "✅ 3. High Risk Pass (Auth changed + Tests added)",
      prContext: {
        categories: { highRisk: ["src/auth/login.js"], tests: ["src/auth/login.test.js"], other: [] },
        totalChanges: 2
      },
      metadata: { baseBranch: "main" },
      expected: "PASS"
    },
    {
      name: "⚠️ 4. Large PR Warning",
      prContext: {
        categories: { highRisk: [], tests: [], other: [] },
        totalChanges: 25 // > 20
      },
      metadata: { baseBranch: "main" },
      expected: "WARN"
    },
    {
      name: "⚠️ 5. Feature Branch Relaxed (Downgrade Block -> Warn)",
      prContext: {
        categories: { highRisk: ["src/auth/login.js"], tests: [], other: [] }, // Should block on main
        totalChanges: 1
      },
      metadata: { baseBranch: "dev-feature" }, // Not main
      expected: "WARN"
    },
    {
      name: "🔓 6. Admin Override",
      prContext: {
        categories: { highRisk: ["src/auth/login.js"], tests: [], other: [] },
        totalChanges: 1
      },
      metadata: { 
        baseBranch: "main", 
        prBody: "Please merge this now! [override-gate:Emergency Fix]",
        userLogin: "admin-user",
        owner: "org",
        repo: "repo"
      },
      expected: "OVERRIDDEN_PASS"
    }
  ];

  for (const scenario of scenarios) {
    logger.info(`Running: ${scenario.name}`);
    const result = await policyEngine.evaluate(scenario.prContext, scenario.metadata);
    
    if (result.decision === scenario.expected) {
      logger.info(`  ✅ Passed (Got ${result.decision})`);
      if (scenario.expected === "BLOCK") {
        logger.info("  Sample Decision Object (BLOCKED)", result);
      }
    } else {
      logger.error(`  ❌ FAILED (Expected ${scenario.expected}, Got ${result.decision})`, { reason: result.decisionReason });
    }
    logger.info("---------------------------------------------------");
  }
}

runTests().catch(err => logger.error('Unhandled error in policy engine tests', err));
