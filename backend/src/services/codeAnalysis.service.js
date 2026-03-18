/**
 * Policy Simulation: Code analysis for upload/paste/zip input.
 * Builds synthetic fact snapshots and runs evaluation without ingesting from GitHub.
 */
import path from 'path';
import { createRequire } from 'module';
import { enrichSnapshotWithAst } from './astAnalyzer.service.js';
import logger from '../logger.js';

const require = createRequire(import.meta.url);
const AdmZip = require('adm-zip');

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_PASTE_SIZE_BYTES = 1024 * 1024; // 1MB for paste
const MAX_ZIP_SIZE_BYTES = 50 * 1024 * 1024; // 50MB for zip
const MAX_FILES_IN_ZIP = 500;
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml']);
const TEST_FILE_PATTERNS = ['.test.', '.spec.', '_test.', 'test_', '__tests__/', '/tests/'];

/**
 * Check if path or content looks like a test file.
 */
function looksLikeTest(pathOrContent, content = '') {
  const lower = (pathOrContent || '').toLowerCase();
  if (TEST_FILE_PATTERNS.some(p => lower.includes(p))) return true;
  const code = (content || '').slice(0, 2000);
  return /describe\s*\(|it\s*\(|test\s*\(|jest\.|vitest\./i.test(code);
}

/**
 * Validate and decode upload. Returns { content, fileName, extension } or throws.
 */
export function validateAndDecodeUpload(fileName, contentBase64) {
  if (!fileName || !contentBase64) {
    const err = new Error('file.name and file.contentBase64 are required for upload');
    err.statusCode = 400;
    throw err;
  }
  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error(`Invalid file type. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  let content;
  try {
    content = Buffer.from(contentBase64, 'base64').toString('utf8');
  } catch (e) {
    const err = new Error('Invalid base64 content');
    err.statusCode = 400;
    throw err;
  }
  const size = Buffer.byteLength(content, 'utf8');
  if (size > MAX_FILE_SIZE_BYTES) {
    const err = new Error(`File too large. Max size: ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
    err.statusCode = 400;
    throw err;
  }
  return { content, fileName, extension: ext };
}

/**
 * Validate paste input. Returns { content, virtualPath } or throws.
 */
export function validatePaste(code, virtualPath) {
  if (!code || typeof code !== 'string') {
    const err = new Error('paste.code is required');
    err.statusCode = 400;
    throw err;
  }
  const size = Buffer.byteLength(code, 'utf8');
  if (size > MAX_PASTE_SIZE_BYTES) {
    const err = new Error(`Pasted code too long. Max: ${MAX_PASTE_SIZE_BYTES / 1024}KB`);
    err.statusCode = 400;
    throw err;
  }
  const pathName = (virtualPath || 'pasted-code.ts').trim() || 'pasted-code.ts';
  const ext = path.extname(pathName).toLowerCase();
  const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.ts';
  const finalPath = pathName.includes('.') ? pathName : `${pathName}${safeExt}`;
  return { content: code, virtualPath: finalPath };
}

/**
 * Validate and extract zip. Returns { files: [{ path, content, extension }] } or throws.
 */
export function validateAndDecodeZip(contentBase64) {
  if (!contentBase64) {
    const err = new Error('zip.contentBase64 is required for zip upload');
    err.statusCode = 400;
    throw err;
  }
  let buf;
  try {
    buf = Buffer.from(contentBase64, 'base64');
  } catch (e) {
    const err = new Error('Invalid base64 content');
    err.statusCode = 400;
    throw err;
  }
  if (buf.length > MAX_ZIP_SIZE_BYTES) {
    const err = new Error(`Zip too large. Max size: ${MAX_ZIP_SIZE_BYTES / 1024 / 1024}MB`);
    err.statusCode = 400;
    throw err;
  }
  const zip = new AdmZip(buf);
  const entries = zip.getEntries().filter(e => !e.isDirectory);
  if (entries.length > MAX_FILES_IN_ZIP) {
    const err = new Error(`Too many files in zip. Max: ${MAX_FILES_IN_ZIP}`);
    err.statusCode = 400;
    throw err;
  }
  const files = [];
  for (const entry of entries) {
    const name = entry.entryName.replace(/^[^/]+\//, '').replace(/\\/g, '/');
    const ext = path.extname(name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) continue;
    let content;
    try {
      content = entry.getData().toString('utf8');
    } catch {
      continue;
    }
    const size = Buffer.byteLength(content, 'utf8');
    if (size > MAX_FILE_SIZE_BYTES) continue;
    files.push({ path: name, content, extension: ext });
  }
  if (files.length === 0) {
    const err = new Error('Zip contains no valid files (allowed: .ts, .tsx, .js, .jsx, .json, .yaml, .yml)');
    err.statusCode = 400;
    throw err;
  }
  return { files };
}

/**
 * Build a synthetic fact snapshot from multiple files (zip).
 */
export function buildSyntheticSnapshotFromZip(files) {
  const changeFiles = files.map(({ path: filePath, content, extension }) => {
    const isTest = looksLikeTest(filePath, content);
    return {
      path: filePath,
      extension,
      status: 'added',
      additions: content.split('\n').length,
      deletions: 0,
      is_test_file: isTest,
      content,
    };
  });
  const testFilesCount = changeFiles.filter(f => f.is_test_file).length;
  const totalAdditions = changeFiles.reduce((s, f) => s + f.additions, 0);
  const pathPrefixes = [...new Set(changeFiles.flatMap(f => f.path.split('/').slice(0, -1).filter(Boolean)))];
  const factData = {
    ingestion_status: { complete: true, ingested_at: new Date().toISOString() },
    provenance: { source: 'zip', ingestion_method: 'code_analysis' },
    pull_request: { title: 'Uploaded zip', base_branch: 'main' },
    changes: {
      total_files: changeFiles.length,
      additions: totalAdditions,
      deletions: 0,
      files: changeFiles,
    },
    metadata: {
      test_files_changed_count: testFilesCount,
      path_prefixes: pathPrefixes,
    },
  };
  enrichSnapshotWithAst(factData);
  return {
    id: `synthetic-zip-${Date.now()}`,
    data: factData,
    repo_full_name: 'upload/zip',
    pr_number: 0,
  };
}

/**
 * Build a synthetic fact snapshot (same shape as FactSnapshot.data) from file or paste.
 */
export function buildSyntheticSnapshot(payload) {
  const { content, fileName, extension, virtualPath } = payload;
  const filePath = fileName || virtualPath || 'pasted-code.ts';
  const ext = extension || path.extname(filePath).toLowerCase() || '.ts';
  const isTest = looksLikeTest(filePath, content);

  const factData = {
    ingestion_status: { complete: true, ingested_at: new Date().toISOString() },
    provenance: { source: 'upload', ingestion_method: 'code_analysis' },
    pull_request: { title: 'Uploaded/Pasted code', base_branch: 'main' },
    changes: {
      total_files: 1,
      additions: content.split('\n').length,
      deletions: 0,
      files: [
        {
          path: filePath,
          extension: ext,
          status: 'added',
          additions: content.split('\n').length,
          deletions: 0,
          is_test_file: isTest,
          content,
        },
      ],
    },
    metadata: {
      test_files_changed_count: isTest ? 1 : 0,
      path_prefixes: filePath.split('/').slice(0, -1).filter(Boolean),
    },
    // For security pattern checker and line numbers
    file_content: content,
    file_path: filePath,
  };
  enrichSnapshotWithAst(factData);

  return {
    id: `synthetic-${Date.now()}`,
    data: factData,
    repo_full_name: 'upload/paste',
    pr_number: 0,
  };
}

/**
 * Run policy evaluation on a synthetic snapshot and return spec-shaped result.
 * Always runs user policy + security_patterns when content is present.
 */
export function runCodeAnalysis(syntheticSnapshot, draftRules, evaluationEngine) {
  const mockPolicy = {
    policy_id: 'code-analysis',
    policy_version_id: 'DRAFT',
    level: 'MANDATORY',
    rules_logic: draftRules,
    reason: 'Code analysis',
  };
  const policies = [mockPolicy];
  // Always run security pattern check when any file has content (upload/paste/zip)
  const hasContent = syntheticSnapshot.data?.file_content ||
    syntheticSnapshot.data?.changes?.files?.some(f => f.content);
  if (hasContent) {
    policies.push({
      policy_id: 'code-analysis',
      policy_version_id: 'DRAFT_SECURITY',
      level: 'MANDATORY',
      rules_logic: { type: 'security_patterns' },
      reason: 'Security scan',
    });
  }

  const evalResult = evaluationEngine.evaluate(syntheticSnapshot, policies);
  // FIX: Use 'violations' property from engine result, not 'structured_violations'
  const violations = evalResult.violations || [];
  const passes = evalResult.passes || [];
  const severityCounts = { BLOCK: 0, WARN: 0, OBSERVE: 0 };
  violations.forEach(v => {
    if (v.severity) severityCounts[v.severity] = (severityCounts[v.severity] || 0) + 1;
  });

  const repo = syntheticSnapshot.repo_full_name || 'upload';
  const prNumber = syntheticSnapshot.pr_number ?? 0;
  const prTitle =
    syntheticSnapshot.data?.pull_request?.title ||
    (syntheticSnapshot.data?.provenance?.source === 'zip'
      ? 'Uploaded zip'
      : 'Uploaded or pasted code');

  const summary = {
    total_snapshots: 1,
    total_violations: violations.length,
    violations_by_severity: severityCounts,
    newly_blocked_count: evalResult.result === 'BLOCK' ? 1 : 0,
    policy_would_block: evalResult.result === 'BLOCK',
    policy_would_pass: evalResult.result === 'PASS',
    fail_rate_change: evalResult.result === 'BLOCK' ? '100.00%' : '0.00%',
    friction_index: evalResult.result === 'BLOCK' ? 'HIGH' : 'LOW',
  };

  const perPrResults = [
    {
      pr_number: prNumber,
      repo,
      verdict: evalResult.result,
      rationale: evalResult.rationale,
      pr_title: prTitle,
      author: null,
      base_branch: null,
      violations,
      passes,
    },
  ];

  return {
    summary,
    violations: violations.map(v => ({ ...v, pr_number: prNumber, repo, pr_title: prTitle })),
    per_pr_results: perPrResults,
    result: evalResult.result,
    rationale: evalResult.rationale,
  };
}
