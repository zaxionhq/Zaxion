import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { shouldScanFileForPolicy } from '../../../src/services/incremental/incrementalFileGate.service.js';
import {
  clearIncrementalEnv,
  restoreIncrementalEnv,
  snapshotIncrementalEnv,
} from '../../helpers/incrementalEnv.js';

describe('incrementalFileGate', () => {
  let saved;

  beforeEach(() => {
    saved = snapshotIncrementalEnv();
    clearIncrementalEnv();
  });

  afterEach(() => {
    restoreIncrementalEnv(saved);
  });

  it('allows all files when router off', () => {
    expect(shouldScanFileForPolicy('package.json', 'code_quality')).toBe(true);
  });

  it('skips manifest for code_quality when router on', () => {
    process.env.INCR_POLICY_ROUTER_ENABLED = 'true';
    expect(shouldScanFileForPolicy('package.json', 'code_quality')).toBe(false);
    expect(shouldScanFileForPolicy('src/app.ts', 'code_quality')).toBe(true);
  });
});
