// backend/src/utils/language.utils.js

import path from 'path';

const LANGUAGE_MAPPING = new Map([
  ['.js', 'javascript'],
  ['.jsx', 'javascript'],
  ['.ts', 'typescript'],
  ['.tsx', 'typescript'],
  ['.py', 'python'],
  ['.java', 'java'],
  ['.cs', 'csharp'],
  ['.go', 'go'],
  ['.rb', 'ruby'],
  ['.php', 'php'],
  ['.cpp', 'cpp'],
  ['.c', 'c'],
  ['.h', 'c'],
  ['.hpp', 'cpp'],
  ['.rs', 'rust'],
  ['.kt', 'kotlin'],
]);

// Common test file patterns for different languages/frameworks
const TEST_FILE_PATTERNS = new Map([
  ['javascript', [/\.test\.js$/, /\.spec\.js$/]],
  ['typescript', [/\.test\.ts$/, /\.spec\.ts$/, /\.test\.tsx$/, /\.spec\.tsx$/]],
  ['python', [/test_.*\.py$/, /.*_test\.py$/]],
  ['java', [/Test.*\.java$/, /.*Test\.java$/]],
  ['csharp', [/.*Tests\.cs$/]],
  ['go', [/.*_test\.go$/]],
  ['ruby', [/.*_spec\.rb$/]],
]);

export function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return LANGUAGE_MAPPING.get(ext) || 'unknown';
}

export function isTestFile(filePath, language) {
  const filename = path.basename(filePath).toLowerCase();
  const patterns = TEST_FILE_PATTERNS.get(language);
  if (patterns) {
    return patterns.some(pattern => pattern.test(filename));
  }
  return false;
}
