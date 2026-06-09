/**
 * Classify changed files by role for policy applicability and report context.
 */
import path from 'path';

/** @typedef {'source'|'test'|'manifest'|'workflow'|'lockfile'|'infrastructure'|'unknown'} FileKind */

const MANIFEST_NAMES = new Set([
  'package.json',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'composer.json',
  'Gemfile',
  'pnpm-workspace.yaml',
]);

const LOCKFILE_NAMES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'poetry.lock',
  'Cargo.lock',
  'go.sum',
  'bun.lockb',
]);

/**
 * @param {string} filePath
 * @returns {FileKind}
 */
export function classifyFileKind(filePath) {
  if (!filePath || typeof filePath !== 'string') return 'unknown';

  const norm = filePath.replace(/\\/g, '/');
  const base = path.posix.basename(norm);
  const lower = norm.toLowerCase();

  if (LOCKFILE_NAMES.has(base)) return 'lockfile';
  if (MANIFEST_NAMES.has(base)) return 'manifest';
  if (/^dockerfile(\.|$)/i.test(base)) return 'infrastructure';
  if (base === 'docker-compose.yml' || base === 'docker-compose.yaml') return 'infrastructure';

  if (lower.includes('/.github/workflows/') || /^\.github\/workflows\//i.test(lower)) {
    return 'workflow';
  }

  if (
    /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(lower) ||
    /\/__tests__\//i.test(lower) ||
    /\/tests?\//i.test(lower) ||
    /_test\.(py|go|rs)$/i.test(lower) ||
    /^test_.*\.py$/i.test(lower)
  ) {
    return 'test';
  }

  const ext = path.extname(norm).toLowerCase();
  const sourceExts = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.py', '.rs', '.go', '.java', '.rb', '.php', '.cs',
    '.vue', '.svelte',
  ]);

  if (sourceExts.has(ext)) return 'source';
  if (ext === '.json' && base !== 'package.json') return 'manifest';
  if (ext === '.yml' || ext === '.yaml') return 'workflow';

  return 'unknown';
}

/**
 * @param {string} filePath
 * @returns {string}
 */
export function detectLanguageFromPath(filePath) {
  const ext = path.extname(String(filePath || '')).toLowerCase();
  const map = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.rs': 'rust',
    '.go': 'go',
    '.java': 'java',
    '.rb': 'ruby',
    '.php': 'php',
    '.cs': 'csharp',
  };
  return map[ext] || 'unknown';
}

export class FileKindClassifierService {
  classify(filePath) {
    return classifyFileKind(filePath);
  }

  detectLanguage(filePath) {
    return detectLanguageFromPath(filePath);
  }

  /**
   * @param {Array<{ path?: string, filePath?: string }>} files
   */
  summarizeFiles(files) {
    const counts = {};
    for (const f of files || []) {
      const p = f.path || f.filePath;
      const kind = classifyFileKind(p);
      counts[kind] = (counts[kind] || 0) + 1;
    }
    return counts;
  }
}
