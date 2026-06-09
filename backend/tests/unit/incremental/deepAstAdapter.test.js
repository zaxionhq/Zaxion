import { validateDeep } from '../../../src/services/incremental/deepAstAdapter.service.js';
import { parseFile } from '../../../src/services/incremental/treeSitterParser.service.js';

describe('deepAstAdapter', () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  it('returns use_legacy when deep AST flag is off', () => {
    delete process.env.INCR_DEEP_AST_ENABLED;
    const content = 'console.log("x");\n';
    const parseResult = parseFile(content, 'src/a.ts');
    const shallow = { semantic_tags: ['console_log'] };
    const r = validateDeep({
      parseResult,
      filePath: 'src/a.ts',
      policyType: 'code_quality',
      shallowFacts: shallow,
    });
    expect(r.use_legacy).toBe(true);
  });

  it('lowers confidence for console in test files when deep AST on', () => {
    process.env.INCR_DEEP_AST_ENABLED = 'true';
    delete process.env.INCR_FORCE_LEGACY;
    const content = 'it("x", () => { console.log("debug"); });\n';
    const parseResult = parseFile(content, 'src/a.test.ts');
    const shallow = { semantic_tags: ['console_log'] };
    const r = validateDeep({
      parseResult,
      filePath: 'src/a.test.ts',
      policyType: 'code_quality',
      shallowFacts: shallow,
    });
    expect(r.confidence).toBeLessThan(0.85);
  });
});
