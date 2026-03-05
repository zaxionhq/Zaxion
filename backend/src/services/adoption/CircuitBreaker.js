/**
 * Circuit Breaker to prevent Zaxion from blocking deployments during outages
 */
export class CircuitBreaker {
  constructor() {
    this.isOpen = false;
    this.failureCount = 0;
    this.threshold = 5;
    this.resetTimeout = 60000; // 1 minute
  }

  /**
   * Execute a critical operation with fail-open protection
   * @param {Function} operation - The async function to execute
   * @returns {Promise<any>} The result or a safe default
   */
  async execute(operation) {
    if (this.isOpen) {
      console.warn('[CircuitBreaker] Circuit is OPEN. Skipping operation.');
      return { status: 'success', description: 'Zaxion skipped (System Protection Mode)' };
    }

    try {
      const result = await operation();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      console.error('[CircuitBreaker] Operation failed', error);
      // Fail Open: Return a PASS result so we don't block the user
      return { status: 'success', description: 'Zaxion skipped (Internal Error)' };
    }
  }

  recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.isOpen = true;
      console.error('[CircuitBreaker] Threshold reached. Opening circuit.');
      setTimeout(() => this.reset(), this.resetTimeout);
    }
  }

  reset() {
    this.failureCount = 0;
    this.isOpen = false;
  }
}
