import { describe, it, expect } from 'vitest';
import { RemediationService } from './Remediation.service.js';
import { AIAdvisorService } from './AIAdvisor.service.js';

describe('Pillar 2: Developer Experience', () => {
  const advisor = new AIAdvisorService();
  const service = new RemediationService(advisor);

  it('should render static template for Secret Detection', async () => {
    const violation = {
      policyId: 'SEC-001',
      context: { file: 'config.js', line: 10 }
    };

    const advice = await service.getAdvice(violation);
    
    expect(advice.title).toBe('Hardcoded Secret Detected');
    expect(advice.steps[0]).toContain('Remove the secret from config.js');
    expect(advice.docs).toBe('/docs/remediation/secrets');
  });

  it('should include AI suggestion when available', async () => {
    const violation = {
      policyId: 'SEC-001',
      context: { file: 'config.js', line: 10 }
    };

    const advice = await service.getAdvice(violation);
    
    expect(advice.aiSuggestion).toBeDefined();
    expect(advice.aiSuggestion.explanation).toContain('AWS Access Key');
  });

  it('should fallback gracefully if AI fails', async () => {
    // Mock failure
    advisor.suggestFix = () => Promise.reject('API Error');
    
    const violation = {
      policyId: 'SEC-001',
      context: { file: 'config.js', line: 10 }
    };

    const advice = await service.getAdvice(violation);
    
    // Should still return static template
    expect(advice.title).toBe('Hardcoded Secret Detected');
    expect(advice.aiSuggestion).toBeNull();
  });
});
