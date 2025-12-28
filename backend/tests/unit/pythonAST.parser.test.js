
import { parsePythonCode } from '../../src/parsers/pythonAST.parser.js';

describe('Python AST Parser', () => {
  test('should extract functions', () => {
    const code = `
def my_function(a, b):
    return a + b

def another_one():
    pass
`;
    const result = parsePythonCode(code);
    expect(result.functions).toHaveLength(2);
    expect(result.functions[0].name).toBe('my_function');
    expect(result.functions[0].params).toEqual(['a', 'b']);
    expect(result.functions[1].name).toBe('another_one');
    expect(result.functions[1].params).toEqual([]);
  });

  test('should extract classes and methods', () => {
    const code = `
class MyClass:
    def method_one(self):
        pass

    def method_two(self, x):
        return x
`;
    const result = parsePythonCode(code);
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].name).toBe('MyClass');
    expect(result.classes[0].methods).toHaveLength(2);
    expect(result.classes[0].methods[0].name).toBe('method_one');
    expect(result.classes[0].methods[1].name).toBe('method_two');
  });

  test('should extract imports', () => {
    const code = `
import os
from sys import path, argv
`;
    const result = parsePythonCode(code);
    expect(result.imports).toHaveLength(2);
    expect(result.imports[0].source).toBe('os');
    expect(result.imports[1].source).toBe('sys');
    expect(result.imports[1].names).toEqual(['path', 'argv']);
  });

  test('should extract docstrings', () => {
    const code = `
def func_with_doc():
    """This is a docstring"""
    pass
`;
    // Note: My parser implementation logic for attaching docstrings was left as "Logic to attach... would go here"
    // So this test might fail if I didn't implement attachment.
    // Let's check the parser code again.
    // I pushed docstring to collectedDocstring but didn't attach it.
    // I should fix the parser to actually attach docstrings.
    const result = parsePythonCode(code);
    // expect(result.functions[0].docstring).toBe('This is a docstring');
    // Docstring attachment logic is now implemented, so this should pass if I uncomment or write a new expect.
    // However, I need to check where it attached.
    // In my code, "func_with_doc" is a function.
    expect(result.functions[0].docstring).toBe('This is a docstring');
  });

  test('should extract comments', () => {
    const code = `
# This is a comment
def foo():
    pass
    # Another comment
`;
    const result = parsePythonCode(code);
    expect(result.comments).toHaveLength(2);
    expect(result.comments[0].text).toBe('This is a comment');
    expect(result.comments[1].text).toBe('Another comment');
  });
});
