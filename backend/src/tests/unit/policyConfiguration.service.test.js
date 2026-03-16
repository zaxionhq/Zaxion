import { jest } from '@jest/globals';
import { PolicyConfigurationService } from '../../services/policyConfiguration.service.js';
import { CORE_POLICIES } from '../../policies/corePolicies.js';

describe('PolicyConfigurationService', () => {
  let db;
  let service;
  let mockPolicyConfiguration;

  beforeEach(() => {
    mockPolicyConfiguration = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      findOrCreate: jest.fn(),
      create: jest.fn(),
    };

    db = {
      PolicyConfiguration: mockPolicyConfiguration,
    };

    service = new PolicyConfigurationService(db);
  });

  describe('isPolicyEnabled', () => {
    it('should return true by default when no configuration exists', async () => {
      mockPolicyConfiguration.findOne.mockResolvedValue(null);
      
      const isEnabled = await service.isPolicyEnabled('SEC-001', { org: 'test-org' });
      expect(isEnabled).toBe(true);
    });

    it('should respect hierarchical disabling (Branch > Repo > Org > Global)', async () => {
      // Branch level disabling
      mockPolicyConfiguration.findOne.mockResolvedValueOnce({ is_enabled: false });
      
      const isEnabled = await service.isPolicyEnabled('SEC-001', { 
        org: 'org1', 
        repo: 'org1/repo1', 
        branch: 'main' 
      });
      
      expect(isEnabled).toBe(false);
      expect(mockPolicyConfiguration.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { policy_id: 'SEC-001', scope: 'BRANCH', target_id: 'org1/repo1:main' }
      }));
    });

    it('should fall back to Org level if no Branch/Repo config exists', async () => {
      mockPolicyConfiguration.findOne
        .mockResolvedValueOnce(null) // Branch
        .mockResolvedValueOnce(null) // Repo
        .mockResolvedValueOnce({ is_enabled: false }); // Org
      
      const isEnabled = await service.isPolicyEnabled('SEC-001', { 
        org: 'org1', 
        repo: 'org1/repo1', 
        branch: 'main' 
      });
      
      expect(isEnabled).toBe(false);
    });
  });

  describe('disablePolicy', () => {
    it('should prevent disabling critical security policies', async () => {
      await expect(service.disablePolicy('SEC-001', 'GLOBAL', null, 'user-id', 'test reason'))
        .rejects.toThrow(/mandatory compliance rule/);
    });

    it('should allow disabling non-critical policies', async () => {
      const mockConfig = { id: 'uuid', save: jest.fn() };
      mockPolicyConfiguration.findOrCreate.mockResolvedValue([mockConfig, true]);
      
      const result = await service.disablePolicy('COD-001', 'GLOBAL', null, 'user-id', 'too noisy');
      
      expect(result).toBe(mockConfig);
      expect(mockPolicyConfiguration.findOrCreate).toHaveBeenCalled();
    });
  });
});
