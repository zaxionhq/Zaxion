/**
 * Orchestrates ScanProgress construction during PR analysis.
 */
import env from '../../config/env.js';
import { buildScanProgress } from './policyReportMapper.service.js';
import { incrementalFlags } from './incrementalFeatureFlags.service.js';

export class ScanProgressBuilderService {
  /**
   * @param {object} params
   * @param {string} params.owner
   * @param {string} params.repo
   * @param {number} params.prNumber
   * @param {string} params.decision
   * @param {Array} params.policyResults
   * @param {Record<string, boolean>} [params.skippedRuleTypes]
   * @param {'RUNNING'|'COMPLETED'} [params.scanStatus]
   */
  buildForPr({
    owner,
    repo,
    prNumber,
    decision,
    policyResults,
    skippedRuleTypes = {},
    scanStatus = 'COMPLETED',
    runningChecks = {},
  }) {
    const frontendUrl = env.FRONTEND_URL || env.get?.('FRONTEND_URL') || 'http://localhost:8080';
    const deepLink = `${frontendUrl}/pr/${owner}/${repo}/${prNumber}`;

    return buildScanProgress({
      policyResults,
      overallDecision: decision,
      deepLink,
      skippedRuleTypes,
      runningChecks,
      scanStatus,
    });
  }

  shouldEmitProgress() {
    return incrementalFlags.isScanProgressUiEnabled();
  }
}

export const scanProgressBuilder = new ScanProgressBuilderService();
