/**
 * Async Dispatcher to handle notifications and external integrations
 */
export class AsyncDispatcherService {
  constructor(slackClient, jiraClient) {
    this.slack = slackClient;
    this.jira = jiraClient;
    this.queue = [];
  }

  /**
   * Dispatch an event to all configured integrations
   * @param {object} decision - The FinalDecisionRecord
   */
  async dispatch(decision) {
    // 1. Filter: Only dispatch if configured
    // In a real app, check DB for repo config
    
    // 2. Slack: Critical Alerts
    if (decision.status === 'BLOCK' && decision.severity === 'CRITICAL') {
      await this.sendSlackAlert(decision);
    }

    // 3. Jira: Persistent Tracking
    if (decision.status === 'BLOCK') {
      await this.syncJiraTicket(decision);
    }
  }

  async sendSlackAlert(decision) {
    const payload = {
      text: `🚨 *Zaxion Critical Block* in \`${decision.repo}\``,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🚨 *Critical Policy Violation Detected*\n*Repo:* ${decision.repo}\n*PR:* #${decision.prId}\n*Policy:* ${decision.violation.policyId}`
          }
        }
      ]
    };
    await this.slack.postMessage(payload);
  }

  async syncJiraTicket(decision) {
    // Idempotency Key: repo-pr-policy
    const issueKey = `ZAX-${decision.repo}-${decision.prId}`;
    
    const existing = await this.jira.findIssue(issueKey);
    
    if (existing) {
      await this.jira.addComment(existing.id, `Simulated Update: Still blocked by ${decision.violation.policyId}`);
    } else {
      await this.jira.createIssue({
        summary: `Zaxion Block: ${decision.repo} PR #${decision.prId}`,
        description: `Blocked by policy ${decision.violation.policyId}`,
        key: issueKey
      });
    }
  }
}
