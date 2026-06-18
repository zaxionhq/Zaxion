import { jest } from '@jest/globals';
import { ViolationExplainerService } from '../../src/services/violationExplainer.service.js';

describe('ViolationExplainerService', () => {
  it('returns unchanged violations when LLM unavailable', async () => {
    const service = new ViolationExplainerService(null);
    const violations = [{ rule_id: 'code_quality', file: 'src/a.ts', message: 'console.log' }];
    const result = await service.explainViolations({
      decision: { decision: 'WARN', violations },
      violations,
    });
    expect(result.enriched).toBe(false);
    expect(result.violations).toHaveLength(1);
  });

  it('merges AI explanations without changing rule_id', async () => {
    const llmMock = {
      generateChatResponse: jest.fn().mockResolvedValue({
        message: JSON.stringify({
          decision_summary: 'Console usage in production path.',
          developer_next_steps: ['Use logger'],
          violations: [{
            rule_id: 'code_quality',
            file: 'src/a.ts',
            line: 1,
            explanation: 'console.log leaks to stdout in prod',
            fix_steps: ['Replace with pino'],
          }],
        }),
      }),
    };

    const service = new ViolationExplainerService(llmMock);
    const violations = [{ rule_id: 'code_quality', file: 'src/a.ts', line: 1, message: 'console.log' }];

    const origEnv = process.env.ADVISOR_ENRICH_EXPLANATIONS;
    const origKey = process.env.GEMINI_API_KEY;
    process.env.ADVISOR_ENRICH_EXPLANATIONS = 'true';
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.LLM_PROVIDER = 'gemini';

    const result = await service.explainViolations({
      decision: { decision: 'WARN', violations },
      violations,
    });

    process.env.ADVISOR_ENRICH_EXPLANATIONS = origEnv;
    process.env.GEMINI_API_KEY = origKey;

    expect(result.enriched).toBe(true);
    expect(result.decision_summary).toContain('Console');
    expect(result.violations[0].ai_explanation).toContain('console.log');
    expect(result.violations[0].rule_id).toBe('code_quality');
  });
});
