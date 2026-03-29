import axios from 'axios';
import path from 'path';
import logger from '../logger.js';
import { enrichSnapshotWithAst, enrichSnapshotWithAstAsync } from './astAnalyzer.service.js';

const GH_API = "https://api.github.com";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_LINES = 2000;
const VALID_EXTENSIONS = new Set(['.js', '.ts', '.tsx', '.py', '.java', '.go', '.php', '.rb', '.cs', '.json', '.yaml', '.yml']);
const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.pdf', '.zip', '.tar', '.gz', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.class',
  '.lock', '.json-lock',
  '.ttf', '.woff', '.woff2', '.mp4', '.mov', '.avi'
]);
const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.env',
  'dist',
  'build',
  'vendor',
  'bin',
  'obj',
  'target',
  'out',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb'
];

function shouldFetchContent(filePath) {
  // Wave 4 Parity Fix: Align with github.service.js ignore logic
  const isIgnored = IGNORED_PATHS.some(ignored => {
    const isInsideDir = filePath.includes(`/${ignored}/`);
    const isStartOfPath = filePath.startsWith(`${ignored}/`);
    const isExactMatch = filePath === ignored;
    return isInsideDir || isStartOfPath || isExactMatch;
  });

  if (isIgnored) {
    return false;
  }
  const ext = path.extname(filePath).toLowerCase();
  if (IGNORED_EXTENSIONS.has(ext)) return false;
  return VALID_EXTENSIONS.has(ext);
}

function isBinaryBuffer(buf) {
  const len = Math.min(buf.length, 1024);

  
  for (let i = 0; i < len; i++) if (buf[i] === 0) return true; // eslint-disable-line security/detect-object-injection
  return false;
}

/**
 * Phase 5 Pillar 1: Fact Ingestion Service
 * Responsible for extracting objective, immutable truth from a GitHub PR
 * and freezing it into a versioned FactSnapshot.
 */
export class FactIngestorService {
  /**
   * @param {object} db - Sequelize db object containing models
   * @param {string} token - GitHub personal access token or installation token
   */
  constructor(db, token) {
    this.db = db;
    this.token = token;
    this.SNAPSHOT_VERSION = '1.0.0';
  }

  /**
   * Capture PR facts and store them as a versioned snapshot
   * @param {string} repoFullName - e.g. "owner/repo"
   * @param {number} prNumber - PR number
   * @param {string} commitSha - Exact commit SHA being evaluated
   * @param {{ fetchContent?: boolean }} opts - fetchContent: true to fetch file contents for security/AST analysis
   * @returns {Promise<object>} The created or existing FactSnapshot
   */
  async ingest(repoFullName, prNumber, commitSha, opts = {}) {
    // 1. Deduplication check (Unique key: repo_full_name + commit_sha)
    const existingSnapshot = await this.db.FactSnapshot.findOne({
      where: { 
        repo_full_name: repoFullName, 
        commit_sha: commitSha 
      }
    });

    if (existingSnapshot) {
      // Wave 4 Enrichment: If content is requested but the existing snapshot doesn't have it,
      // we perform a partial ingestion to add file contents.
      const hasContent = existingSnapshot.data?.changes?.files?.some(f => f.content);
      if (opts.fetchContent && !hasContent) {
        logger.info({ repoFullName, commitSha }, "FactIngestor: Enriching existing snapshot with file contents");
        return await this._enrichSnapshotWithContent(existingSnapshot);
      }

      logger.info({ repoFullName, commitSha }, "FactIngestor: Returning existing FactSnapshot");
      return existingSnapshot;
    }

    logger.info({ repoFullName, prNumber, commitSha }, "FactIngestor: Starting new fact ingestion");

    try {
      // 2. Fetch PR Metadata
      const { data: prMetadata, headers: prHeaders } = await this._fetchPRMetadata(repoFullName, prNumber);
      
      // 3. Fetch PR Files
      const { data: filesData, headers: filesHeaders } = await this._fetchPRFiles(repoFullName, prNumber);

      const files = [];
      for (const f of filesData) {
        const fileObj = {
          path: f.filename,
          extension: path.extname(f.filename),
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          is_test_file: false, // Initial value
        };
        const canFetch = shouldFetchContent(f.filename);
        if (opts.fetchContent && canFetch && f.raw_url) {
          try {
            const content = await this._fetchFileContent(f.raw_url);
            if (content) {
              fileObj.content = content;
              // Re-evaluate is_test_file with content
              fileObj.is_test_file = this._isTestFile(f.filename, content);
            } else {
              fileObj.is_test_file = this._isTestFile(f.filename);
            }
          } catch (err) {
            logger.warn({ file: f.filename, err: err.message }, 'FactIngestor: Could not fetch file content');
            fileObj.is_test_file = this._isTestFile(f.filename);
          }
        } else {
          fileObj.is_test_file = this._isTestFile(f.filename);
        }
        files.push(fileObj);
      }

      // 4. Extract path prefixes (Deterministic derivation)
      const pathPrefixes = this._extractPathPrefixes(files);

      // 5. Detect test files count (Deterministic derivation)
      const testFilesCount = files.filter(f => f.is_test_file).length;

      // 6. Assemble Fact Data (Schema matches Pillar 5.1 design)
      const factData = {
        ingestion_status: {
          complete: true,
          missing_fields: [],
          ingested_at: new Date().toISOString()
        },
        provenance: {
          source: "github",
          api_version: "v3",
          ingestion_method: "api",
          rate_limit_remaining: parseInt(prHeaders['x-ratelimit-remaining'] || filesHeaders['x-ratelimit-remaining'] || "0", 10)
        },
        pull_request: {
          title: prMetadata.title,
          author: {
            github_user_id: prMetadata.user.id,
            username: prMetadata.user.login
          },
          base_branch: prMetadata.base.ref,
          labels: prMetadata.labels.map(l => l.name),
          is_draft: prMetadata.draft
        },
        changes: {
          total_files: files.length,
          additions: files.reduce((sum, f) => sum + f.additions, 0),
          deletions: files.reduce((sum, f) => sum + f.deletions, 0),
          files: files
        },
        metadata: {
          test_files_changed_count: testFilesCount,
          path_prefixes: pathPrefixes
        }
      };

      // 7. Save Snapshot to database
      const snapshot = await this.db.FactSnapshot.create({
        repo_full_name: repoFullName,
        pr_number: prNumber,
        commit_sha: commitSha,
        data: factData,
        snapshot_version: this.SNAPSHOT_VERSION,
        ingested_at: new Date()
      });

      logger.info({ snapshotId: snapshot.id }, "FactIngestor: Successfully created FactSnapshot");
      return snapshot;

    } catch (error) {
      logger.error({ error: error.message, repoFullName, prNumber }, "FactIngestor: Failed to ingest facts");
      throw new Error(`Fact ingestion failed: ${error.message}`);
    }
  }

  /**
   * Fetches PR metadata from GitHub API
   */
  async _fetchPRMetadata(repoFullName, prNumber) {
    return await axios.get(`${GH_API}/repos/${repoFullName}/pulls/${prNumber}`, {
      headers: { 
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
  }

  /**
   * Fetches raw file content from GitHub (for full-content analysis)
   */
  async _fetchFileContent(rawUrl) {
    const { data } = await axios.get(rawUrl, {
      headers: { Authorization: `Bearer ${this.token}` },
      responseType: 'arraybuffer',
      timeout: 10000,
      maxContentLength: MAX_FILE_SIZE,
    });
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (!buf.length || buf.length > MAX_FILE_SIZE) return null;
    if (isBinaryBuffer(buf)) return null;
    let content = buf.toString('utf8');
    if (!content.trim()) return null;
    const lines = content.split('\n');
    if (lines.length > MAX_LINES) content = lines.slice(0, MAX_LINES).join('\n');
    return content;
  }

  /**
   * Fetches files changed in the PR from GitHub API, with pagination.
   */
  async _fetchPRFiles(repoFullName, prNumber) {
    let page = 1;
    let allFiles = [];
    let hasNext = true;
    let lastHeaders = {};

    while (hasNext) {
      const response = await axios.get(`${GH_API}/repos/${repoFullName}/pulls/${prNumber}/files`, {
        headers: { 
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github.v3+json"
        },
        params: { per_page: 100, page }
      });

      lastHeaders = response.headers;
      const files = response.data;
      
      if (!files || files.length === 0) {
        hasNext = false;
      } else {
        allFiles = allFiles.concat(files);
        if (files.length < 100) hasNext = false;
        else page++;
      }
    }

    return { data: allFiles, headers: lastHeaders };
  }

  /**
   * Deterministically identifies if a file is a test file based on naming conventions.
   * Authority: Phase 5 Pillar 5.1 Design.
   */
  _isTestFile(filename, content = '') {
    const lowerPath = filename.toLowerCase();
    
    // 1. Check for standard test file patterns in filename
    const filePatterns = ['.test.', '.spec.', '_test.', 'test_'];
    if (filePatterns.some(pattern => lowerPath.includes(pattern))) {
      return true;
    }

    // 2. Check if file is inside a test directory
    const dirPatterns = ['tests/', 'test/', '__tests__/'];
    if (dirPatterns.some(dir => 
      lowerPath.startsWith(dir) || lowerPath.includes('/' + dir)
    )) {
      return true;
    }

    // Wave 4 Enhancement: Check content for test frameworks (matches codeAnalysis.service.js)
    if (content) {
      const code = content.slice(0, 2000);
      return /describe\s*\(|it\s*\(|test\s*\(|jest\.|vitest\./i.test(code);
    }

    return false;
  }

  /**
   * Deterministically extracts all unique directory prefixes from the changed file paths.
   * e.g. "src/auth/login.ts" -> ["src", "src/auth"]
   */
  _extractPathPrefixes(files) {
    const prefixes = new Set();
    files.forEach(f => {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        let current = "";
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts.at(i);
          if (!part) continue;
          current = current ? `${current}/${part}` : part;
          prefixes.add(current);
        }
      }
    });
    return Array.from(prefixes).sort();
  }

  /**
   * Wave 4: Enrichment Logic
   * Fetches file contents and/or AST for an existing snapshot or fact data object.
   */
  async enrichFactData(factData, repoFullName, prNumber, opts = { fetchContent: true, enrichAst: true }) {
    if (!factData || !factData.changes || !factData.changes.files) return factData;

    const files = factData.changes.files;
    let hasContent = files.some(f => f.content);

    // 1. Fetch Content if needed and missing
    if (opts.fetchContent && !hasContent && repoFullName && prNumber) {
      try {
        const { data: filesData } = await this._fetchPRFiles(repoFullName, prNumber);
        for (const f of files) {
          const matchingFile = filesData.find(fd => fd.filename === f.path);
          if (matchingFile && matchingFile.raw_url && shouldFetchContent(f.path)) {
            try {
              const content = await this._fetchFileContent(matchingFile.raw_url);
              if (content) {
                f.content = content;
                f.is_test_file = this._isTestFile(f.path, content);
              }
            } catch (err) {
              logger.warn({ file: f.path, err: err.message }, 'FactIngestor: Enrichment failed for file content');
            }
          }
        }
        factData.ingestion_status.ingested_at = new Date().toISOString();
      } catch (error) {
        logger.error({ error: error.message, repoFullName, prNumber }, "FactIngestor: PR files fetch failed during enrichment");
      }
    }

    // 2. Add AST if needed
    if (opts.enrichAst) {
      await enrichSnapshotWithAstAsync(factData);
    }

    return factData;
  }

  async _enrichSnapshotWithContent(snapshot) {
    const { repo_full_name, pr_number } = snapshot;
    const factData = await this.enrichFactData(snapshot.data, repo_full_name, pr_number, { fetchContent: true, enrichAst: true });
    
    snapshot.data = factData;
    snapshot.changed('data', true);
    await snapshot.save();

    return snapshot;
  }
}
