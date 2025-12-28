// backend/src/services/codeAnalyzer.service.js

import { detectLanguage, isTestFile } from '../utils/language.utils.js';
import { parsePythonCode } from '../parsers/pythonAST.parser.js';

// A simple line-based analyzer for JavaScript/TypeScript
function analyzeJsTsCode(code) {
  const functions = [];
  const classes = [];
  const imports = [];

  const lines = code.split(/\r?\n/);

  // Regex patterns (applied to trimmed lines)
  // Matches: function myFunc(
  const funcDeclRegex = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\(/;
  // Matches: const myFunc = function( or const myFunc = (args) =>
  const funcExprRegex = /^(?:export\s+)?const\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*(?:async\s*)?(?:function\s*\(|\(.*\)\s*=>)/;
  // Matches: class MyClass
  const classRegex = /^(?:export\s+)?(?:default\s+)?class\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/;
  
  // Matches: import ... from '...'
  const importFromRegex = /^import\s+(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/;
  // Matches: const ... = require('...')
  const requireRegex = /const\s+.*?\s*=\s*require\(['"]([^'"]+)['"]\)/;
  // Matches: export ... from '...'
  const exportFromRegex = /^export\s+(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/;
  // Matches: import '...'
  const importSideEffectRegex = /^import\s+['"]([^'"]+)['"]/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check for Class
    const classMatch = line.match(classRegex);
    if (classMatch) {
      classes.push({
        name: classMatch[1],
        line: i + 1
      });
      continue;
    }

    // Check for Function Declaration
    const funcDeclMatch = line.match(funcDeclRegex);
    if (funcDeclMatch) {
      functions.push({
        name: funcDeclMatch[1],
        line: i + 1
      });
      continue;
    }

    // Check for Function Expression
    const funcExprMatch = line.match(funcExprRegex);
    if (funcExprMatch) {
      functions.push({
        name: funcExprMatch[1],
        line: i + 1
      });
      continue;
    }

    // Check for Imports
    let importMatch = line.match(importFromRegex) || line.match(requireRegex) || line.match(exportFromRegex) || line.match(importSideEffectRegex);
    if (importMatch) {
      imports.push({
        source: importMatch[1],
        line: i + 1
      });
    }
  }

  return { functions, classes, imports };
}

export async function analyzeCodeFile(file) {
  const language = detectLanguage(file.path);
  const isTest = isTestFile(file.path, language);

  let analysis = { functions: [], classes: [], imports: [] };

  if (language === 'javascript' || language === 'typescript') {
    analysis = analyzeJsTsCode(file.content);
  } else if (language === 'python') {
    analysis = parsePythonCode(file.content);
  }

  // Extend with other language-specific parsers as needed

  return {
    path: file.path,
    language,
    isTest,
    extractedElements: analysis,
  };
}
