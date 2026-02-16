import { jest } from '@jest/globals';

// Define mocks BEFORE importing the module under test
jest.unstable_mockModule('../../src/services/waitlist.service.js', () => ({
  waitlistService: {
    join: jest.fn(),
  },
}));

jest.unstable_mockModule('../../src/queues/email.queue.js', () => ({
  addWelcomeEmailJob: jest.fn(),
}));

jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  log: jest.fn(),
  error: jest.fn(),
}));

// Import the module dynamically after mocking
const waitlistController = await import('../../src/controllers/waitlist.controller.js');
const { waitlistService } = await import('../../src/services/waitlist.service.js');
const { addWelcomeEmailJob } = await import('../../src/queues/email.queue.js');

describe('Waitlist Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: { email: 'test@example.com' },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Jest-Test' },
      app: { locals: { db: {} } }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('joinWaitlist', () => {
    it('should add user to waitlist and enqueue email job', async () => {
      // Setup mock return
      waitlistService.join.mockResolvedValue({
        existing: false,
        entry: {
          id: 1,
          email: 'test@example.com',
          position: 100
        }
      });

      await waitlistController.joinWaitlist(req, res);

      // Verify waitlist service called
      expect(waitlistService.join).toHaveBeenCalledWith(
        expect.any(Object), // db
        expect.objectContaining({
          email: 'test@example.com',
          ipAddress: '127.0.0.1'
        })
      );

      // Verify email job enqueued (CRITICAL CHECK)
      expect(addWelcomeEmailJob).toHaveBeenCalledWith('test@example.com');

      // Verify response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Protocol registration initiated. Check your inbox.'
      }));
    });

    it('should handle existing email (200 - Idempotent)', async () => {
      // Simulate existing user
      waitlistService.join.mockResolvedValue({
        existing: true,
        entry: { email: 'test@example.com' }
      });

      await waitlistController.joinWaitlist(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Protocol registration verified.'
      }));
      expect(addWelcomeEmailJob).not.toHaveBeenCalled(); // No email for duplicate
    });

    it('should return 201 even if queueing email fails (fail-open)', async () => {
      waitlistService.join.mockResolvedValue({
        existing: false,
        entry: { id: 1 }
      });
      
      // Simulate queue failure
      addWelcomeEmailJob.mockRejectedValue(new Error('Redis down'));

      await waitlistController.joinWaitlist(req, res);

      // Should still succeed for the user
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });
});
