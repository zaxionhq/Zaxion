import jwt from "jsonwebtoken";
import axios from "axios";
import fs from "fs";
import path from "path";
import env from "../config/env.js";
import logger from "../logger.js";

import os from "os";

class GitHubAppService {
  constructor() {
    this.appId = env.get("GITHUB_APP_ID");
    this.tokenCache = new Map(); // Cache tokens: { installationId: { token, expiresAt } }
    this._privateKey = null;
  }

  /**
   * Retrieves the private key from env or file
   */
  getPrivateKey() {
    if (this._privateKey) return this._privateKey;

    let keyPath = env.get("GITHUB_PRIVATE_KEY_PATH");
    const rawKey = env.get("GITHUB_PRIVATE_KEY");

    if (keyPath) {
      try {
        // Expand home directory (~) if present
        if (keyPath.startsWith("~")) {
          keyPath = path.join(os.homedir(), keyPath.slice(1));
        }

        // Resolve path: absolute paths stay as is, relative paths resolved from process.cwd()
        const absolutePath = path.resolve(process.cwd(), keyPath);
        
        // Ensure path is within expected bounds or at least is a string
        if (typeof absolutePath !== 'string') throw new Error("Invalid private key path");

        logger.info({ path: absolutePath }, "Loading GitHub App private key from file");
        this._privateKey = fs.readFileSync(absolutePath, "utf8");
        return this._privateKey;
      } catch (err) {
        logger.error({ err, keyPath }, "Failed to read GITHUB_PRIVATE_KEY_PATH");
      }
    }

    if (rawKey) {
      this._privateKey = rawKey.replace(/\\n/g, "\n");
      return this._privateKey;
    }

    throw new Error("GITHUB_APP_ID configured but neither GITHUB_PRIVATE_KEY nor GITHUB_PRIVATE_KEY_PATH is available.");
  }

  /**
   * Generates a JWT for GitHub App authentication
   */
  generateJwt() {
    const privateKey = this.getPrivateKey();
    if (!this.appId || !privateKey) {
      throw new Error("GITHUB_APP_ID and private key must be configured for GitHub App authentication.");
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // Issued 60 seconds ago to account for clock drift
      exp: now + (10 * 60), // Expires in 10 minutes
      iss: this.appId,
    };

    return jwt.sign(payload, privateKey, { algorithm: "RS256" });
  }
   /* Gets an installation access token for a specific installation ID
   * @param {string|number} installationId 
   */
  async getInstallationAccessToken(installationId) {
    if (!installationId) {
      throw new Error("No installationId provided. GitHub App authentication requires an installation ID.");
    }

    // Check cache
    const cached = this.tokenCache.get(installationId);
    if (cached && cached.expiresAt > Date.now() + 60000) {
      return cached.token;
    }

    try {
      const appJwt = this.generateJwt();
      const response = await axios.post(
        `${env.get("GITHUB_API_URL")}/app/installations/${installationId}/access_tokens`,
        {},
        {
          headers: {
            Authorization: `Bearer ${appJwt}`,
            Accept: "application/vnd.github+json",
          },
        }
      );

      const { token, expires_at } = response.data;
      const expiresAt = new Date(expires_at).getTime();

      // Cache the token
      this.tokenCache.set(installationId, { token, expiresAt });

      return token;
    } catch (error) {
      if (error.response?.status === 429 || error.response?.status === 403) {
        logger.warn({ 
          installationId, 
          status: error.response.status, 
          headers: error.response.headers 
        }, "GitHub API Rate Limit Hit (Installation Token)");
      }
      logger.error({ error: error.response?.data || error.message, installationId }, "Failed to get GitHub App installation token");
      throw new Error(`Failed to authenticate as GitHub App installation: ${error.message}`);
    }
  }

  /**
   * Finds the installation ID for a specific repository using App JWT
   */
  async getInstallationIdForRepo(owner, repo) {
    try {
      const appJwt = this.generateJwt();
      const response = await axios.get(
        `${env.get("GITHUB_API_URL")}/repos/${owner}/${repo}/installation`,
        {
          headers: {
            Authorization: `Bearer ${appJwt}`,
            Accept: "application/vnd.github+json",
          },
        }
      );
      return response.data.id;
    } catch (error) {
      logger.error({ error: error.response?.data || error.message, owner, repo }, "Failed to get installation ID for repository");
      return null;
    }
  }
}

export default new GitHubAppService();
