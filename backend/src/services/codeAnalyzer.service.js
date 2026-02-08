// backend/src/services/codeAnalyzer.service.js

import { detectLanguage, isTestFile } from '../utils/language.utils.js';
import { parsePythonCode } from '../parsers/pythonAST.parser.js';

// A simple line-based analyzer for JavaScript/TypeScript
function analyzeJsTsCode(code) {
  const functions = [];
  const classes = [];
  const imports = [];

  const lines = code.split(/\r?\n/);

  // Regex patterns (applied to trimmed lines) - Hardened to avoid ReDoS by limiting repetitions
   const funcDeclRegex = /^(?:export[ \t]{1,50})?(?:default[ \t]{1,50})?(?:async[ \t]{1,50})?function[ \t]{1,50}([a-zA-Z_$][0-9a-zA-Z_$]{0,100})[ \t]{0,50}\(/;
   const funcExprRegex = /^(?:export[ \t]{1,50})?const[ \t]{1,50}([a-zA-Z_$][0-9a-zA-Z_$]{0,100})[ \t]{0,50}=[ \t]{0,50}(?:async[ \t]{1,50})?(?:function[ \t]{0,50}\(|(?:\([^)]*?\)|[a-zA-Z_$][0-9a-zA-Z_$]*)[ \t]{0,50}=>)/;
   const classRegex = /^(?:export[ \t]{1,50})?(?:default[ \t]{1,50})?class[ \t]{1,50}([a-zA-Z_$][0-9a-zA-Z_$]{0,100})/;
  
  // Matches: import ... from '...'
  const importFromRegex = /^import[ \t]{1,50}(?:[^'"]{1,500}?)[ \t]{1,50}from[ \t]{1,50}['"]([^'"]{1,500}?)['"]/;
  // Matches: const ... = require('...')
  const requireRegex = /const[ \t]{1,50}[^=]{1,500}?[ \t]{0,50}=[ \t]{0,50}require\(['"]([^'"]{1,500}?)['"]\)/;
  // Matches: export ... from '...'
  const exportFromRegex = /^export[ \t]{1,50}(?:[^'"]{1,500}?)[ \t]{1,50}from[ \t]{1,50}['"]([^'"]{1,500}?)['"]/;
  // Matches: import '...'
  const importSideEffectRegex = /^import[ \t]{1,50}['"]([^'"]{1,500}?)['"]/;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines.at(i);
    if (typeof rawLine !== 'string') continue;
    const line = rawLine.trim();
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
