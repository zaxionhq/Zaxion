import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanProgressBuilder } from '../../src/services/incremental/scanProgressBuilder.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, '../fixtures/scan-progress/all-pass/policy_results.json');

describe('scan-progress fixtures', () => {
  it('all-pass fixture builds completed scan with passed rows', () => {
    process.env.INCR_SCAN_PROGRESS_UI_ENABLED = 'true';
    delete process.env.INCR_FORCE_LEGACY;

    const policyResults = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    const progress = scanProgressBuilder.buildForPr({
      owner: 'acme',
      repo: 'demo',
      prNumber: 1,
      decision: 'PASS',
      policyResults,
      skippedRuleTypes: {},
      scanStatus: 'COMPLETED',
    });

    expect(progress.scan_status).toBe('COMPLETED');
    expect(progress.sections.length).toBeGreaterThan(0);
    const allRows = progress.sections.flatMap((s) => s.checks);
    expect(allRows.some((r) => r.state === 'passed')).toBe(true);
  });
});
