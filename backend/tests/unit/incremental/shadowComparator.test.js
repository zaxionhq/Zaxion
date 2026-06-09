import { compareOutcomes } from '../../../src/services/incremental/shadowComparator.service.js';

describe('shadowComparator', () => {
  it('classifies true_improvement when legacy has more violations', () => {
    const legacy = { final_verdict: 'WARN', violations: [{}, {}, {}] };
    const incr = { final_verdict: 'PASS', violations: [] };
    const r = compareOutcomes(legacy, incr);
    expect(r.classification).toBe('true_improvement');
    expect(r.fp_legacy_only).toBe(3);
  });

  it('classifies exact_match', () => {
    const legacy = { final_verdict: 'PASS', violations: [] };
    const incr = { final_verdict: 'PASS', violations: [] };
    expect(compareOutcomes(legacy, incr).classification).toBe('exact_match');
  });
});
