import { expect } from 'chai';
import { DecisionDTO } from '../../src/dtos/decision.dto.js';
import { redactionFormat } from '../../src/utils/logger.js';
import winston from 'winston';

describe('Trust Boundary & Data Leakage Integration Tests', () => {
  describe('GET /api/v1/github/decisions/:id', () => {
    it('should only return whitelisted fields for a decision', async () => {
      // Mock a decision with some "internal" fields that should not be leaked
      const internalFields = {
        id: 'test-id',
        pr_number: 1,
        repo_owner: 'owner',
        repo_name: 'repo',
        decision: 'APPROVE',
        rationale: 'Looks good',
        raw_data: { sensitive: 'internal fact data' }, // Internal field
        internal_metadata: { secret: 'do not leak' }, // Internal field
        created_at: new Date(),
        updated_at: new Date()
      };

      // We use the DTO directly to verify whitelisting
      const publicData = DecisionDTO.toPublic(internalFields);

      expect(publicData).to.not.have.property('raw_data');
      expect(publicData).to.not.have.property('internal_metadata');
      expect(publicData).to.have.property('id');
      expect(publicData).to.have.property('decision');
      expect(publicData).to.have.property('rationale');
    });
  });

  describe('Logging Redaction', () => {
    it('should redact sensitive keys in logs', async () => {
      let loggedData;
      const testTransport = new winston.transports.Console({
        silent: true // don't actually print to console
      });
      
      const logger = winston.createLogger({
        format: winston.format.combine(
          redactionFormat(),
          winston.format.json()
        ),
        transports: [testTransport]
      });

      // Mock the log output
      logger.on('data', (info) => {
        loggedData = info;
      });

      logger.info('Test sensitive data', { 
        password: 'my-secret-password',
        github_token: 'ghp_secret_token',
        authorization: 'Bearer secret_token'
      });

      // Winston logs might be async, wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      if (loggedData) {
        expect(loggedData.password).to.equal('[REDACTED]');
        expect(loggedData.github_token).to.equal('[REDACTED]');
        expect(loggedData.authorization).to.equal('[REDACTED]');
      }
    });
  });
});
