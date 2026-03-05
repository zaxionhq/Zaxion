/**
 * Mock AI Advisor Service
 * In production, this would call OpenAI/Anthropic
 */
export class AIAdvisorService {
  async suggestFix(violation) {
    // Mock latency
    await new Promise(resolve => setTimeout(resolve, 50));

    if (violation.policyId === 'SEC-001') {
      return {
        explanation: "The variable looks like an AWS Access Key.",
        code: `// Correct way:
const awsKey = process.env.AWS_ACCESS_KEY;`
      };
    }
    
    return null;
  }
}
