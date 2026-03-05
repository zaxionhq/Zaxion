import { describe, it, expect } from 'vitest';
import { ASTParserService } from './astParser.service.js';

describe('ASTParserService', () => {
  const parser = new ASTParserService();

  it('should parse valid JavaScript code', () => {
    const code = `function hello() { return "world"; }`;
    const ast = parser.parseCode(code, 'test.js');
    expect(ast.type).toBe('File');
  });

  it('should extract function names', () => {
    const code = `
      function declaredFunc() {}
      const arrowFunc = () => {};
      class MyClass {
        method() {}
      }
    `;
    const ast = parser.parseCode(code, 'test.js');
    const functions = parser.extractFunctionNames(ast);
    expect(functions).toContain('declaredFunc');
    expect(functions).toContain('arrowFunc');
    expect(functions).toContain('method');
  });

  it('should handle parse errors gracefully', () => {
    const code = `function broken( {`; // Syntax error
    const ast = parser.parseCode(code, 'test.js');
    expect(ast.type).toBe('ParseError');
  });
});
