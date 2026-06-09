import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import { incrementalAnalyzer } from '../../../src/services/incremental/incrementalAnalyzer.service.js';

import {

  clearIncrementalEnv,

  restoreIncrementalEnv,

  snapshotIncrementalEnv,

} from '../../helpers/incrementalEnv.js';



describe('incrementalAnalyzer', () => {

  let saved;



  beforeEach(() => {

    saved = snapshotIncrementalEnv();

    clearIncrementalEnv();

  });



  afterEach(() => {

    restoreIncrementalEnv(saved);

  });



  it('returns null when all incremental flags off', () => {

    const r = incrementalAnalyzer.analyzeFile('const x = 1;', 'src/a.ts');

    expect(r).toBeNull();

  });



  it('analyzes JS file when parse enabled', () => {

    process.env.INCR_PARSE_ENABLED = 'true';

    const r = incrementalAnalyzer.analyzeFile('export const x = 1;\n', 'src/a.ts');

    expect(r?.enabled).toBe(true);

    expect(r?.language).toBe('typescript');

    expect(r?.file_kind).toBe('source');

  });

});

