import { describe, it, expect } from 'vitest';
import { DiffAnalysisService } from './diffAnalysis.service.js';

describe('DiffAnalysisService', () => {
  const service = new DiffAnalysisService();

  it('should parse a simple patch', () => {
    const patch = `@@ -1,3 +1,4 @@
 line1
-line2
+newLine2
+newLine3`;
    
    const changes = service.parsePatch(patch);
    
    expect(changes).toHaveLength(2);
    expect(changes[0]).toEqual({ line: 2, type: 'ADDED', content: 'newLine2' });
    expect(changes[1]).toEqual({ line: 3, type: 'ADDED', content: 'newLine3' });
  });

  it('should handle empty patches', () => {
    expect(service.parsePatch('')).toEqual([]);
  });
});
