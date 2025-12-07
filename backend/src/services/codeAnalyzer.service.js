// backend/src/services/codeAnalyzer.service.js

import { detectLanguage, isTestFile } from '../utils/language.utils.js';

// A simple regex-based analyzer for JavaScript/TypeScript
function analyzeJsTsCode(code) {
  const functions = [];
  const classes = [];
  const imports = [];

  // Regex to find function declarations and expressions
  const functionRegex = /(?:function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\(|const\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*function\s*\(|const\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*\(.*\)\s*=>|async\s+function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\()/g;
  let match;
  while ((match = functionRegex.exec(code)) !== null) {
    const name = match[1] || match[2] || match[3] || match[4];
    if (name) functions.push(name);
  }

  // Regex to find class declarations
  const classRegex = /class\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/g;
  while ((match = classRegex.exec(code)) !== null) {
    if (match[1]) classes.push(match[1]);
  }

  // Regex to find imports
  // Matches:
  // import ... from '...'
  // const ... = require('...')
  // export ... from '...'
  const importRegex = /(?:import\s+(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"])|(?:const\s+.*?\s*=\s*require\(['"]([^'"]+)['"]\))|(?:export\s+(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"])/g;
  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1] || match[2] || match[3];
    if (importPath) imports.push(importPath);
  }

  return { functions, classes, imports };
}

export async function analyzeCodeFile(file) {
  const language = detectLanguage(file.path);
  const isTest = isTestFile(file.path, language);

  let analysis = { functions: [], classes: [], imports: [] };

  if (language === 'javascript' || language === 'typescript') {
    analysis = analyzeJsTsCode(file.content);
  }

  // Extend with other language-specific parsers as needed

  return {
    path: file.path,
    language,
    isTest,
    extractedElements: analysis,
  };
}
