/**
 * Parse layer abstraction. v1 uses Babel as bridge backend until Tree-sitter grammars ship.
 */
import { parse } from '@babel/parser';
import { classifyFileKind, detectLanguageFromPath } from './fileKindClassifier.service.js';
import { incrementalFlags } from './incrementalFeatureFlags.service.js';

const PARSER_VERSION = 'babel-bridge-v1';
const PY_PARSER_VERSION = 'python-shallow-v1';
const JS_TS_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const PY_EXTS = new Set(['.py']);

/**
 * @param {string} filePath
 */
function fileExt(filePath) {
  const dot = filePath.lastIndexOf('.');
  return dot >= 0 ? filePath.slice(dot).toLowerCase() : '';
}

function isJsTsPath(filePath) {
  return JS_TS_EXTS.has(fileExt(filePath));
}

function isPyPath(filePath) {
  return PY_EXTS.has(fileExt(filePath));
}

/**
 * Shallow Python structural parse (Tree-sitter placeholder until grammars ship).
 */
function parsePythonShallow(content, filePath) {
  const language = 'python';
  const file_kind = classifyFileKind(filePath);
  const lines = (content || '').split('\n');
  const diagnostics = [];
  const hasPrint = /\bprint\s*\(/.test(content || '');
  const hasExec = /\b(os\.system|subprocess\.|exec\s*\()/.test(content || '');

  return {
    success: true,
    parser_engine: 'python-shallow',
    parser_version: PY_PARSER_VERSION,
    language,
    file_kind,
    root: {
      type: 'Module',
      shallow: true,
      line_count: lines.length,
      tags: [
        ...(hasPrint ? ['print_call'] : []),
        ...(hasExec ? ['command_exec_candidate'] : []),
      ],
    },
    diagnostics,
  };
}

/**
 * @param {string} content
 * @param {string} filePath
 */
export function parseFile(content, filePath = '') {
  const language = detectLanguageFromPath(filePath);
  const file_kind = classifyFileKind(filePath);

  if (!content) {
    return {
      success: false,
      parser_engine: 'babel-bridge',
      parser_version: PARSER_VERSION,
      language,
      file_kind,
      root: null,
      diagnostics: [{ message: 'unsupported_or_empty', severity: 'info' }],
    };
  }

  if (isPyPath(filePath)) {
    return parsePythonShallow(content, filePath);
  }

  if (!isJsTsPath(filePath)) {
    return {
      success: false,
      parser_engine: 'babel-bridge',
      parser_version: PARSER_VERSION,
      language,
      file_kind,
      root: null,
      diagnostics: [{ message: 'unsupported_or_empty', severity: 'info' }],
    };
  }

  try {
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
      sourceFilename: filePath,
    });

    return {
      success: true,
      parser_engine: 'babel-bridge',
      parser_version: PARSER_VERSION,
      language,
      file_kind,
      root: ast,
      diagnostics: [],
    };
  } catch (err) {
    return {
      success: false,
      parser_engine: 'babel-bridge',
      parser_version: PARSER_VERSION,
      language,
      file_kind,
      root: null,
      diagnostics: [{ message: err.message, severity: 'error' }],
    };
  }
}

export class TreeSitterParserService {
  /**
   * @param {string} content
   * @param {string} filePath
   */
  parse(content, filePath) {
    if (!incrementalFlags.isParseEnabled()) {
      return { skipped: true, reason: 'INCR_PARSE_ENABLED=false' };
    }
    return parseFile(content, filePath);
  }
}
