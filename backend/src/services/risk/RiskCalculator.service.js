/**
 * Service to calculate Repository Risk Scores
 */
export class RiskCalculatorService {
  constructor(archiveService) {
    this.archive = archiveService;
  }

  /**
   * Calculate the current risk score for a repository
   * @param {string} repoId - The repository ID
   * @returns {Promise<object>} { score: number, level: string, trend: string }
   */
  async calculateRisk(repoId) {
    const history = await this.archive.getHistory(repoId, 50); // Look at last 50 PRs
    
    if (!history || history.length === 0) {
      return { score: 0, level: 'SAFE', trend: 'STABLE' };
    }

    let totalWeight = 0;
    
    for (const record of history) {
      if (record.status === 'BLOCK') {
        totalWeight += this.getSeverityWeight(record.severity);
      }
    }

    // Normalize: Score is (Weighted Violations / Total PRs) * 100
    // But capped at 100.
    const rawScore = (totalWeight / history.length) * 10; 
    const score = Math.min(Math.round(rawScore), 100);

    return {
      score,
      level: this.getRiskLevel(score),
      trend: this.calculateTrend(history)
    };
  }

  getSeverityWeight(severity) {
    switch (severity) {
      case 'CRITICAL': return 10;
      case 'HIGH': return 5;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }

  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  }

  calculateTrend(history) {
    // Simple trend: Compare first half vs second half of history
    // (Note: history is sorted newest first)
    const mid = Math.floor(history.length / 2);
    const recent = history.slice(0, mid);
    const older = history.slice(mid);

    const recentBlocks = recent.filter(r => r.status === 'BLOCK').length;
    const olderBlocks = older.filter(r => r.status === 'BLOCK').length;

    if (recentBlocks > olderBlocks) return 'WORSENING';
    if (recentBlocks < olderBlocks) return 'IMPROVING';
    return 'STABLE';
  }
}
