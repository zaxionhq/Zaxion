
import { chunkFile } from '../../src/services/chunking.service.js';

describe('Chunking Service', () => {
  test('should return single chunk for small files (< 200 lines)', async () => {
    const content = Array(50).fill('const x = 1;').join('\n');
    const file = {
      path: 'small.js',
      content,
      extractedElements: { functions: [], classes: [], imports: [] }
    };

    const chunks = await chunkFile(file);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].type).toBe('module');
    expect(chunks[0].startLine).toBe(1);
    expect(chunks[0].endLine).toBe(50);
  });

  test('should split by functions/classes for medium files (200-1000 lines)', async () => {
    // Simulate a file with ~300 lines
    // Lines 1-99: gap
    // Line 100: Function A start
    // Line 199: Function A end (implied by next start)
    // Line 200: Class B start
    // Line 300: EOF
    
    const lines = Array(300).fill('');
    lines[0] = '// Header content'; // Line 1
    lines[99] = 'function functionA() {}'; // Line 100
    lines[199] = 'class ClassB {}'; // Line 200
    
    const content = lines.join('\n');
    
    const file = {
      path: 'medium.js',
      content,
      extractedElements: {
        functions: [{ name: 'functionA', line: 100 }],
        classes: [{ name: 'ClassB', line: 200 }],
        imports: []
      }
    };

    const chunks = await chunkFile(file);
    
    // Expected chunks:
    // 1. Gap (1-99)
    // 2. Function A (100-199)
    // 3. Class B (200-300)
    // 4. Tail? No, Class B goes to 300.
    
    // Check types
    const types = chunks.map(c => c.type);
    expect(types).toContain('module_gap');
    expect(types).toContain('function');
    expect(types).toContain('class');
    
    const funcChunk = chunks.find(c => c.type === 'function');
    expect(funcChunk.startLine).toBe(100);
    expect(funcChunk.endLine).toBe(199);
    
    const classChunk = chunks.find(c => c.type === 'class');
    expect(classChunk.startLine).toBe(200);
    expect(classChunk.endLine).toBe(300);
  });

  test('should deep split for large files (> 1000 lines)', async () => {
    // Simulate > 1000 lines
    const lines = Array(1200).fill('');
    // Line 100: Class start
    // Line 110: Method 1 start
    // Line 150: Method 2 start
    // Line 200: Class ends (next function starts)
    // Line 201: Function start
    
    const content = lines.join('\n');
    
    const file = {
      path: 'large.py',
      content,
      extractedElements: {
        classes: [{ name: 'BigClass', line: 100 }],
        functions: [{ name: 'helper_func', line: 201 }],
        methods: [
            { name: 'method_one', line: 110, className: 'BigClass' },
            { name: 'method_two', line: 150, className: 'BigClass' }
        ],
        imports: []
      }
    };

    const chunks = await chunkFile(file);
    
    // Expected:
    // Gap 1-99
    // Class Header 100-109
    // Method 1 110-149
    // Method 2 150-200 (until Function start - 1)
    // Function 201-1200
    
    const methodChunks = chunks.filter(c => c.type === 'method');
    expect(methodChunks).toHaveLength(2);
    expect(methodChunks[0].startLine).toBe(110);
    expect(methodChunks[0].endLine).toBe(149);
    
    const classChunk = chunks.find(c => c.type === 'class');
    expect(classChunk.startLine).toBe(100);
    expect(classChunk.endLine).toBe(109);
    
    const funcChunk = chunks.find(c => c.type === 'function');
    expect(funcChunk.startLine).toBe(201);
    expect(funcChunk.endLine).toBe(1200);
  });
});
