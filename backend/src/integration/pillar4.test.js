import { describe, it, expect } from 'vitest';
import { ASTParserService } from '../services/ast/astParser.service.js';
import { DiffAnalysisService } from '../services/diff/diffAnalysis.service.js';
import { PatternMatchingEngine } from '../services/patterns/patternMatcher.service.js';

describe('Pillar 4: End-to-End Flow', () => {
  const parser = new ASTParserService();
  const diffService = new DiffAnalysisService();
  const engine = new PatternMatchingEngine();

  it('should detect malicious code added in a patch', () => {
    // 1. Simulate a Malicious PR Diff
    const patch = `@@ -1,3 +1,4 @@
 function safe() {
   return true;
 }
+eval("stealData()");`;

    // 2. Parse the diff to find changed lines
    const changes = diffService.parsePatch(patch);
    const changedLines = changes.map(c => c.line); // [4]

    // 3. Simulate the full file content after the patch
    const fileContent = `function safe() {
  return true;
}
eval("stealData()");`;

    // 4. Parse AST
    const ast = parser.parseCode(fileContent, 'malicious.js');

    // 5. Scan for patterns
    const violations = engine.scan(ast);

    // 6. Verify detection
    const dangerousEval = violations.find(v => v.id === 'DANGEROUS_EVAL');
    expect(dangerousEval).toBeDefined();
    
    // 7. Verify the violation is in the Changed Lines
    // Note: Line 4 in file content corresponds to the added line
    expect(changedLines).toContain(dangerousEval.line);
  });

  it('should ignore safe refactors', () => {
    const patch = `@@ -1,3 +1,3 @@
-const x = 1;
+const x = 2;`;
    
    const fileContent = `const x = 2;`;
    const ast = parser.parseCode(fileContent, 'safe.js');
    const violations = engine.scan(ast);
    
    expect(violations).toHaveLength(0);
  });
});
