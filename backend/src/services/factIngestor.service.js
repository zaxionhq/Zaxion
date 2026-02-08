import axios from 'axios';
import path from 'path';
import logger from '../logger.js';

const GH_API = "https://api.github.com";

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
   * @returns {Promise<object>} The created or existing FactSnapshot
   */
  async ingest(repoFullName, prNumber, commitSha) {
    // 1. Deduplication check (Unique key: repo_full_name + commit_sha)
    const existingSnapshot = await this.db.FactSnapshot.findOne({
      where: { 
        repo_full_name: repoFullName, 
        commit_sha: commitSha 
      }
    });

    if (existingSnapshot) {
      logger.info({ repoFullName, commitSha }, "FactIngestor: Returning existing FactSnapshot");
      return existingSnapshot;
    }

    logger.info({ repoFullName, prNumber, commitSha }, "FactIngestor: Starting new fact ingestion");

    try {
      // 2. Fetch PR Metadata
      const { data: prMetadata, headers: prHeaders } = await this._fetchPRMetadata(repoFullName, prNumber);
      
      // 3. Fetch PR Files
      const { data: filesData, headers: filesHeaders } = await this._fetchPRFiles(repoFullName, prNumber);
      
      const files = filesData.map(f => ({
        path: f.filename,
        extension: path.extname(f.filename),
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        is_test_file: this._isTestFile(f.filename)
      }));

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
   * Fetches files changed in the PR from GitHub API
   */
  async _fetchPRFiles(repoFullName, prNumber) {
    // Note: This fetches up to 100 files. For extremely large PRs, pagination would be needed.
    return await axios.get(`${GH_API}/repos/${repoFullName}/pulls/${prNumber}/files?per_page=100`, {
      headers: { 
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
  }

  /**
   * Deterministically identifies if a file is a test file based on naming conventions.
   * Authority: Phase 5 Pillar 5.1 Design.
   */
  _isTestFile(filename) {
    const lowerPath = filename.toLowerCase();
    
    // 1. Check for standard test file patterns in filename
    const filePatterns = ['.test.', '.spec.', '_test.', 'test_'];
    if (filePatterns.some(pattern => lowerPath.includes(pattern))) {
      return true;
    }

    // 2. Check if file is inside a test directory
    const dirPatterns = ['tests/', 'test/', '__tests__/'];
    return dirPatterns.some(dir => 
      lowerPath.startsWith(dir) || lowerPath.includes('/' + dir)
    );
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
}
