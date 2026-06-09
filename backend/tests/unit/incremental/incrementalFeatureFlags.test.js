import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import { IncrementalFeatureFlagsService } from '../../../src/services/incremental/incrementalFeatureFlags.service.js';

import {

  clearIncrementalEnv,

  restoreIncrementalEnv,

  snapshotIncrementalEnv,

} from '../../helpers/incrementalEnv.js';



describe('IncrementalFeatureFlagsService', () => {

  let saved;



  beforeEach(() => {

    saved = snapshotIncrementalEnv();

    clearIncrementalEnv();

  });



  afterEach(() => {

    restoreIncrementalEnv(saved);

  });



  it('defaults all flags to false', () => {

    const svc = new IncrementalFeatureFlagsService();

    expect(svc.isParseEnabled()).toBe(false);

    expect(svc.isRouterEnabled()).toBe(false);

    expect(svc.isScanProgressUiEnabled()).toBe(false);

  });



  it('respects INCR_PARSE_ENABLED=true', () => {

    process.env.INCR_PARSE_ENABLED = 'true';

    const svc = new IncrementalFeatureFlagsService();

    expect(svc.isParseEnabled()).toBe(true);

  });



  it('INCR_FORCE_LEGACY disables all flags', () => {

    process.env.INCR_PARSE_ENABLED = 'true';

    process.env.INCR_FORCE_LEGACY = 'true';

    const svc = new IncrementalFeatureFlagsService();

    expect(svc.isParseEnabled()).toBe(false);

    expect(svc.isForcedLegacy()).toBe(true);

  });

});

