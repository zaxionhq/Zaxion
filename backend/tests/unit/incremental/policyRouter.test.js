import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import { routePolicy } from '../../../src/services/incremental/policyRouter.service.js';

import {

  clearIncrementalEnv,

  restoreIncrementalEnv,

  snapshotIncrementalEnv,

} from '../../helpers/incrementalEnv.js';



describe('policyRouter', () => {

  let saved;



  beforeEach(() => {

    saved = snapshotIncrementalEnv();

    clearIncrementalEnv();

  });



  afterEach(() => {

    restoreIncrementalEnv(saved);

  });



  it('returns legacy when router flag off', () => {

    const r = routePolicy({

      policyType: 'reliability',

      files: [{ path: 'src/main.rs' }],

    });

    expect(r.path).toBe('legacy');

  });



  it('skips reliability on rust-only PR when router on', () => {

    process.env.INCR_POLICY_ROUTER_ENABLED = 'true';

    const r = routePolicy({

      policyType: 'reliability',

      files: [{ path: 'src/main.rs' }],

    });

    expect(r.path).toBe('skip');

    expect(r.skip_reason).toBeTruthy();

  });



  it('runs supply_chain on workflow file when router on', () => {

    process.env.INCR_POLICY_ROUTER_ENABLED = 'true';

    const r = routePolicy({

      policyType: 'supply_chain_integrity',

      files: [{ path: '.github/workflows/ci.yml' }],

    });

    expect(r.path).toBe('shallow');

  });

});

