import { describe, test, expect } from '@jest/globals';
import { PatternMatcherService } from '../../src/services/patternMatcher.service.js';

describe('PatternMatcherService', () => {
  test('does not flag Python with/eval as no-deprecated-apis', () => {
    const engine = new PatternMatcherService();
    const py = `with open("f.txt") as f:\n    x = eval("1")\n`;
    const violations = engine.analyzeCode(py, 'src/foo.py');
    const deprecated = violations.filter((v) => v.policy === 'no-deprecated-apis');
    expect(deprecated).toHaveLength(0);
  });

  test('flags dangerouslySetInnerHTML in tsx', () => {
    const engine = new PatternMatcherService();
    const code = 'export const a = <div dangerouslySetInnerHTML={{ __html: x }} />';
    const violations = engine.analyzeCode(code, 'src/Comp.tsx');
    const dom = violations.find((v) => v.pattern === 'Deprecated DOM API');
    expect(dom).toBeDefined();
    expect(dom.line).toBeGreaterThan(0);
  });

  test('skips Deprecated DOM API in __tests__ paths', () => {
    const engine = new PatternMatcherService();
    const code = 'el.innerHTML = bad';
    const violations = engine.analyzeCode(code, 'src/__tests__/util.ts');
    const dom = violations.find((v) => v.pattern === 'Deprecated DOM API');
    expect(dom).toBeUndefined();
  });

  test('flags Dangerous eval() in app js outside tests', () => {
    const engine = new PatternMatcherService();
    const violations = engine.analyzeCode('eval("x");', 'src/lib/util.js');
    expect(violations.some((v) => v.pattern === 'Dangerous eval()')).toBe(true);
  });

  test('skips Dangerous eval() in spec files', () => {
    const engine = new PatternMatcherService();
    const violations = engine.analyzeCode('eval("x");', 'src/lib/util.spec.ts');
    expect(violations.some((v) => v.pattern === 'Dangerous eval()')).toBe(false);
  });
});
