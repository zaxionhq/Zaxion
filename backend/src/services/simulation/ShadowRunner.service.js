/**
 * Service to execute policies in "Shadow Mode" (Read-Only)
 */
export class ShadowRunnerService {
  constructor() {
    this.results = [];
  }

  /**
   * Run a policy against a set of historical facts
   * @param {BasePolicy} policy - The policy instance to test
   * @param {Array<object>} historicalFacts - List of FactSnapshots
   * @returns {Promise<object>} Simulation Report
   */
  async simulate(policy, historicalFacts) {
    const report = {
      policyId: policy.id,
      totalScanned: historicalFacts.length,
      blocks: 0,
      passes: 0,
      violations: []
    };

    for (const facts of historicalFacts) {
      // Execute policy logic without side effects
      // Note: BasePolicy.evaluate is pure by design (returns status, doesn't write DB)
      const result = await policy.evaluate(facts);

      if (result.status === 'BLOCK') {
        report.blocks++;
        report.violations.push({
          prId: facts.prId,
          repo: facts.repo,
          violations: result.violations
        });
      } else {
        report.passes++;
      }
    }

    report.blockRate = (report.blocks / report.totalScanned) * 100;
    return report;
  }
}
