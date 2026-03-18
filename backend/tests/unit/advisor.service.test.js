import { jest } from '@jest/globals';
import { AdvisorService } from '../../src/services/advisor.service.js';

describe('AdvisorService', () => {
  let advisor;

  beforeEach(() => {
    advisor = new AdvisorService({});
  });

  it('should generate intents for high risk files', async () => {
    const decision = { decision: 'BLOCK' };
    const prContext = {
      categories: {
        highRisk: ['auth/login.js']
      }
    };

    const result = await advisor.enrich(decision, prContext);
    
    expect(result.suggestedTestIntents).toHaveLength(1);
    expect(result.suggestedTestIntents[0].file).toBe('auth/login.js');
    expect(result.suggestedTestIntents[0].intent).toContain('Verify login logic stability');
  });

  it('should generate intents for security violations', async () => {
    const decision = {
      decision: 'BLOCK',
      violations: [
        {
          rule_id: 'security_patterns',
          file: 'utils/helper.js',
          message: 'Possible hardcoded credential'
        }
      ]
    };
    const prContext = {
      categories: { highRisk: [] }
    };

    const result = await advisor.enrich(decision, prContext);
    
    expect(result.suggestedTestIntents).toHaveLength(1);
    expect(result.suggestedTestIntents[0].file).toBe('utils/helper.js');
    expect(result.suggestedTestIntents[0].intent).toContain('Remediate security violation');
    expect(result.suggestedTestIntents[0].rationale).toContain('Detected security_patterns violation');
  });

  it('should deduplicate intents', async () => {
    const decision = {
      decision: 'BLOCK',
      violations: [
        {
          rule_id: 'security_patterns',
          file: 'auth/login.js',
          message: 'Possible hardcoded credential'
        }
      ]
    };
    const prContext = {
      categories: { highRisk: ['auth/login.js'] }
    };

    const result = await advisor.enrich(decision, prContext);
    
    // Should have 2 intents: one for high risk path, one for security violation
    // Deduplication logic uses file+intent as key.
    // Intent strings are different ("Verify..." vs "Remediate...")
    expect(result.suggestedTestIntents).toHaveLength(2);
    
    const files = result.suggestedTestIntents.map(i => i.file);
    expect(files).toEqual(['auth/login.js', 'auth/login.js']);
  });
});
