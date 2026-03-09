import { describe, it, expect } from 'vitest';
import { PatternMatchingEngine } from './patternMatcher.service.js';
import { ASTParserService } from '../ast/astParser.service.js';

describe('PatternMatchingEngine', () => {
  const engine = new PatternMatchingEngine();
  const parser = new ASTParserService();

  it('should detect dangerous eval() calls', () => {
    const code = `const x = eval("alert(1)");`;
    const ast = parser.parseCode(code, 'test.js');
    const violations = engine.scan(ast);
    
    expect(violations).toHaveLength(1);
    expect(violations[0].id).toBe('DANGEROUS_EVAL');
    expect(violations[0].severity).toBe('CRITICAL');
  });

  it('should detect hardcoded AWS keys', () => {
    const code = `const key = "AKIA1234567890123456";`; // 20 chars starting with AKIA
    const ast = parser.parseCode(code, 'test.js');
    const violations = engine.scan(ast);
    
    expect(violations).toHaveLength(1);
    expect(violations[0].id).toBe('HARDCODED_SECRET');
  });

  it('should ignore safe code', () => {
    const code = `const x = "safe string"; logger.debug(x);`;
    const ast = parser.parseCode(code, 'test.js');
    const violations = engine.scan(ast);
    
    expect(violations).toHaveLength(0);
  });
});
