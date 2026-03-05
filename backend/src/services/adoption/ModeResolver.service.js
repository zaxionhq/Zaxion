/**
 * Service to resolve the enforcement mode for a repository
 */
export class ModeResolverService {
  constructor(db) {
    this.db = db;
    this.defaultMode = 'OBSERVE_ONLY';
  }

  /**
   * Get the current mode for a repository
   * @param {string} repoId - The repository identifier
   * @returns {Promise<string>} 'OBSERVE_ONLY' | 'WARN_ONLY' | 'ENFORCE'
   */
  async getMode(repoId) {
    try {
      // In a real app, this would query the database
      // For now, we'll use a mock in-memory store or default
      const mode = await this.db.getRepoMode(repoId);
      return mode || this.defaultMode;
    } catch (error) {
      console.error(`[ModeResolver] Failed to fetch mode for ${repoId}, defaulting to SAFE mode`, error);
      return 'OBSERVE_ONLY'; // Fail-Safe
    }
  }

  /**
   * Resolve the final verdict based on mode
   * @param {string} verdict - The Judge's verdict ('PASS' | 'BLOCK')
   * @param {string} mode - The current mode
   * @returns {object} { status: 'success' | 'failure' | 'neutral', description: string }
   */
  resolveVerdict(verdict, mode) {
    if (verdict === 'PASS') {
      return { status: 'success', description: 'Zaxion checks passed.' };
    }

    // Verdict is BLOCK
    switch (mode) {
      case 'ENFORCE':
        return { status: 'failure', description: 'Zaxion blocked this PR due to policy violations.' };
      case 'WARN_ONLY':
        return { status: 'neutral', description: '⚠️ Zaxion found violations (Warning Mode).' };
      case 'OBSERVE_ONLY':
      default:
        return { status: 'success', description: 'Zaxion found violations (Observe Mode - No Action Taken).' };
    }
  }
}
