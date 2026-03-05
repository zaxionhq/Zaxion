import { describe, it, expect } from 'vitest';
import { ASTParserService } from './astParser.service.js';

describe('ASTParserService Performance', () => {
  const parser = new ASTParserService();

  it('should parse a large file (5000 lines) under 200ms', () => {
    // 1. Generate a large file
    const lines = [];
    for (let i = 0; i < 5000; i++) {
      lines.push(`export const func${i} = () => { return ${i} * 2; };`);
    }
    const code = lines.join('\n');

    // 2. Measure parsing time
    const start = performance.now();
    const ast = parser.parseCode(code, 'largeFile.ts');
    const end = performance.now();
    const duration = end - start;

    // 3. Assertions
    expect(ast.type).toBe('File');
    console.log(`Parsed 5000 lines in ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(200);
  });
});
