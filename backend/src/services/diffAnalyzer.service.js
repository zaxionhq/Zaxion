import { Octokit } from "@octokit/rest";
import { minimatch } from "minimatch";
import env from "../config/env.js";

/**
 * Service to fetch and analyze PR diffs
 */
export class DiffAnalyzerService {
  constructor(githubToken) {
    this.octokit = new Octokit({ auth: githubToken });
  }

  /**
   * Fetch changed files and classify them
   * @param {string} owner 
   * @param {string} repo 
   * @param {number} prNumber 
   * @returns {Promise<object>} PRContext
   */
  async analyze(owner, repo, prNumber) {
    // 1. Fetch Files
    // Using pagination to ensure we get all files (up to a limit, e.g., 100)
    // For MVP, we'll fetch one page of 100 files.
    const { data: files } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100
    });

    // 2. Filter & Classify
    const context = {
      files: [], // Array of { filename, content }
      totalChanges: files.length,
      categories: {
        highRisk: [],
        tests: [],
        other: []
      },
      security: {
        secretsFound: []
      }
    };

    // Globs for classification
    // Policy 1: auth/payment/config files
    const HIGH_RISK_GLOBS = [
      "**/auth/**/*", 
      "**/payment/**/*", 
      "**/config/**/*", 
      "**/.env*", 
      "**/secrets/**/*",
      "**/billing/**/*"
    ];
    
    // Test files
    const TEST_GLOBS = [
      "**/*.test.ts", "**/*.test.js", 
      "**/*.spec.ts", "**/*.spec.js", 
      "**/tests/**/*", "**/__tests__/**/*"
    ];

    // Ignored files (docs, assets, etc.)
    const IGNORED_GLOBS = [
      "*.md", "*.lock", ".gitignore", "docs/**/*", "LICENSE", 
      "**/*.png", "**/*.jpg", "**/*.svg"
    ];

    // Secret patterns
    const SECRET_PATTERNS = [
      /sk-proj-[a-zA-Z0-9]{32,}/i, // OpenAI
      /ghp_[a-zA-Z0-9]{36}/i,      // GitHub PAT
      /postgres:\/\/.*:.*@/i,      // DB Connection string
      /aws_access_key_id\s*=\s*['"][A-Z0-9]{20}['"]/i // AWS
    ];

    // Check each file
    for (const file of files) {
      const filename = file.filename;
      const content = file.patch || ""; // patch contains the diff content

      // Populate files array for content-based checks
      context.files.push({ filename, content });

      // Scan for secrets in content
      SECRET_PATTERNS.forEach(pattern => {
        if (pattern.test(content)) {
          context.security.secretsFound.push({
            file: filename,
            pattern: pattern.toString()
          });
        }
      });

      // Skip ignored files for high-risk categorization
      if (IGNORED_GLOBS.some(glob => minimatch(filename, glob))) {
        continue;
      }

      let categorized = false;

      // Check if tests
      if (TEST_GLOBS.some(glob => minimatch(filename, glob))) {
        context.categories.tests.push(filename);
        categorized = true;
      }

      // Check for high risk (only if not a test file)
      if (!categorized && HIGH_RISK_GLOBS.some(glob => minimatch(filename, glob))) {
        context.categories.highRisk.push(filename);
        categorized = true;
      }

      // If neither, mark as other (source code)
      if (!categorized) {
        context.categories.other.push(filename);
      }
    }

    return context;
  }
}
