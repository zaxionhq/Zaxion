
import { analyzeCodeFile } from '../../src/services/codeAnalyzer.service.js';

describe('Code Analyzer Service (JS/TS)', () => {
  test('should extract entities with line numbers from JS code', async () => {
    const code = `
import fs from 'fs';

function myFunction() {
  return true;
}

class MyClass {
  constructor() {}
}

const arrowFunc = () => {
  return false;
};
`;

    const file = { path: 'test.js', content: code };
    const result = await analyzeCodeFile(file);
    const { functions, classes, imports } = result.extractedElements;

    // Line 1: empty
    // Line 2: import fs from 'fs';
    // Line 3: empty
    // Line 4: function myFunction() {
    // ...
    // Line 8: class MyClass {
    // ...
    // Line 12: const arrowFunc = () => {

    expect(imports).toHaveLength(1);
    expect(imports[0].source).toBe('fs');
    expect(imports[0].line).toBe(2);

    expect(functions).toHaveLength(2);
    const funcNames = functions.map(f => f.name);
    expect(funcNames).toContain('myFunction');
    expect(funcNames).toContain('arrowFunc');
    
    const myFunc = functions.find(f => f.name === 'myFunction');
    expect(myFunc.line).toBe(4);

    const arrow = functions.find(f => f.name === 'arrowFunc');
    expect(arrow.line).toBe(12);

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toBe('MyClass');
    expect(classes[0].line).toBe(8);
  });
});
