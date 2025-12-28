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

    const fileList = files.map(f => f.filename);

    // 2. Filter & Classify
    const context = {
      files: fileList,
      totalChanges: files.length,
      categories: {
        highRisk: [],
        tests: [],
        other: []
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

    // Check each file
    for (const file of fileList) {
      // Skip ignored files
      if (IGNORED_GLOBS.some(glob => minimatch(file, glob))) {
        continue;
      }

      let categorized = false;

      // Check if tests
      if (TEST_GLOBS.some(glob => minimatch(file, glob))) {
        context.categories.tests.push(file);
        categorized = true;
      }

      // Check for high risk (only if not a test file)
      if (!categorized && HIGH_RISK_GLOBS.some(glob => minimatch(file, glob))) {
        context.categories.highRisk.push(file);
        categorized = true;
      }

      // If neither, mark as other (source code)
      if (!categorized) {
        context.categories.other.push(file);
      }
    }

    return context;
  }
}
