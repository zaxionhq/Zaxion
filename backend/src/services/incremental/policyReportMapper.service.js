/**
 * Maps policy evaluation results to sectioned ScanProgress for GitHub + app UI.
 */
import { REPORT_SECTIONS } from '../../config/policyReportSections.js';

/** @typedef {'pending'|'running'|'passed'|'warn'|'failed'|'skipped'} ReportRowState */

/**
 * @param {string} verdict
 * @returns {ReportRowState}
 */
export function verdictToRowState(verdict, skipped = false) {
  if (skipped) return 'skipped';
  switch (String(verdict || '').toUpperCase()) {
    case 'PASS':
      return 'passed';
    case 'WARN':
    case 'OBSERVE':
      return 'warn';
    case 'BLOCK':
      return 'failed';
    default:
      return 'passed';
  }
}

/**
 * @param {ReportRowState} state
 * @param {number} issueCount
 */
export function rowSummaryText(state, issueCount = 0) {
  switch (state) {
    case 'pending':
      return 'Pending';
    case 'running':
      return 'Running…';
    case 'passed':
      return 'No issues';
    case 'skipped':
      return 'Not applicable';
    case 'warn':
      return issueCount > 0 ? `${issueCount} warning(s)` : 'Warning';
    case 'failed':
      return issueCount > 0 ? `${issueCount} issue(s)` : 'Issues found';
    default:
      return '';
  }
}

/**
 * @param {ReportRowState} state
 */
export function rowMarkdownIcon(state) {
  switch (state) {
    case 'passed':
      return '✅';
    case 'warn':
      return '🟡';
    case 'failed':
      return '❌';
    case 'running':
      return '⏳';
    case 'skipped':
      return '➖';
    default:
      return '⬜';
  }
}

/**
 * Aggregate policy results for a check row.
 * @param {string[]} ruleTypes
 * @param {Array<{ policy_type?: string, verdict?: string }>} policyResults
 * @param {boolean} [skipped]
 */
export function aggregateCheckRow(ruleTypes, policyResults, skipped = false) {
  const matching = (policyResults || []).filter((p) =>
    ruleTypes.includes(p.policy_type)
  );

  if (skipped && matching.length === 0) {
    return { state: 'skipped', issueCount: 0, verdict: 'SKIP' };
  }

  if (matching.length === 0) {
    return { state: 'passed', issueCount: 0, verdict: 'PASS' };
  }

  const hasBlock = matching.some((p) => p.verdict === 'BLOCK');
  const hasWarn = matching.some((p) =>
    ['WARN', 'OBSERVE'].includes(p.verdict)
  );
  const issueCount = matching.filter((p) => p.verdict !== 'PASS').length;

  if (hasBlock) {
    return { state: 'failed', issueCount, verdict: 'BLOCK' };
  }
  if (hasWarn) {
    return { state: 'warn', issueCount, verdict: 'WARN' };
  }
  return { state: 'passed', issueCount: 0, verdict: 'PASS' };
}

/**
 * @param {object} params
 * @param {Array} params.policyResults
 * @param {string} [params.overallDecision]
 * @param {string} [params.deepLink]
 * @param {Record<string, boolean>} [params.skippedRuleTypes]
 * @param {Record<string, 'pending'|'running'>} [params.runningChecks]
 * @param {'RUNNING'|'COMPLETED'} [params.scanStatus]
 */
export function buildScanProgress({
  policyResults = [],
  overallDecision = 'PASS',
  deepLink = '',
  skippedRuleTypes = {},
  runningChecks = {},
  scanStatus = 'COMPLETED',
}) {
  const sections = REPORT_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    order: section.order,
    checks: section.checks.map((check) => {
      const skipped = check.rule_types.every((rt) => skippedRuleTypes[rt]);
      const agg = aggregateCheckRow(check.rule_types, policyResults, skipped);

      let state = agg.state;
      if (runningChecks[check.id]) {
        state = runningChecks[check.id];
      }

      const issueCount = agg.issueCount;
      return {
        id: check.id,
        label: check.label,
        state,
        rule_types: check.rule_types,
        issue_count: issueCount,
        summary: rowSummaryText(state, issueCount),
      };
    }),
  }));

  const overallLabel =
    scanStatus === 'RUNNING'
      ? 'Analyzing…'
      : overallDecision === 'PASS'
        ? 'Passed'
        : overallDecision === 'WARN'
          ? 'Warning'
          : overallDecision === 'BLOCK'
            ? 'Blocked'
            : overallDecision === 'OVERRIDDEN_PASS'
              ? 'Bypass authorized'
              : String(overallDecision);

  return {
    scan_status: scanStatus,
    overall_label: overallLabel,
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sections,
    deep_link: deepLink,
  };
}

/**
 * GitHub-flavored markdown for check output / sticky comment.
 * @param {ReturnType<typeof buildScanProgress>} scanProgress
 */
export function renderScanProgressMarkdown(scanProgress) {
  if (!scanProgress) return '';

  const lines = [];
  lines.push(`### Zaxion Security & Governance Report`);
  lines.push('');
  if (scanProgress.overall_label) {
    lines.push(`**Status:** ${scanProgress.overall_label}`);
    lines.push('');
  }

  for (const section of scanProgress.sections || []) {
    lines.push(`**${section.label}**`);
    for (const check of section.checks || []) {
      const icon = rowMarkdownIcon(check.state);
      lines.push(`- ${icon} ${check.label} — ${check.summary}`);
    }
    lines.push('');
  }

  if (scanProgress.deep_link) {
    lines.push(`[View full report](${scanProgress.deep_link})`);
  }

  return lines.join('\n').trim();
}

export class PolicyReportMapperService {
  buildScanProgress(params) {
    return buildScanProgress(params);
  }

  renderMarkdown(scanProgress) {
    return renderScanProgressMarkdown(scanProgress);
  }
}
