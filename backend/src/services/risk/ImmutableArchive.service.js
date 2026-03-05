/**
 * Service to store and retrieve FinalDecisionRecords
 * This acts as the "Black Box" flight recorder for the system.
 */
export class ImmutableArchiveService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Archive a decision permanently
   * @param {object} decision - The FinalDecisionRecord
   */
  async archive(decision) {
    const record = {
      ...decision,
      archivedAt: new Date().toISOString(),
      // Ensure we don't store the actual secret value, just metadata
      violation: {
        ...decision.violation,
        context: this.sanitizeContext(decision.violation.context)
      }
    };

    // In a real app, this would insert into a Time-Series DB or Append-Only Log
    await this.db.insertRecord(record);
    return record;
  }

  sanitizeContext(context) {
    // Redact potential secrets from stored context
    if (context && context.content) {
      return { ...context, content: '[REDACTED]' };
    }
    return context;
  }

  async getHistory(repoId, limit = 100) {
    return this.db.query({ repo: repoId }, { limit, sort: { archivedAt: -1 } });
  }
}
