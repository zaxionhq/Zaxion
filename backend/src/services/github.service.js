// src/services/github.service.js
import axios from "axios";
import { githubServiceCallCounter } from "../utils/metrics.js";
import path from "path";
import logger from "../logger.js";

const GH_API = "https://api.github.com";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const OAUTH_REDIRECT = process.env.GITHUB_REDIRECT_URI || "http://localhost:5000/api/v1/auth/github/callback";

export function getLoginUrl() {
  const operation = 'getLoginUrl';
  let status = 'success';
  try {
    // Generate a more robust state parameter
    const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const scope = "repo";
    // Return both the URL and state so it can be set as a cookie
    return {
      url: `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
        OAUTH_REDIRECT
      )}&scope=${encodeURIComponent(scope)}&state=${state}`,
      state: state
    };
  } catch (error) {
    status = 'failure';
    throw error;
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}

export async function exchangeCodeForToken({ code }) {
  const operation = 'exchangeCodeForToken';
  let status = 'success';
  try {
    // OAuth app token exchange
    const url = `https://github.com/login/oauth/access_token`;
    const { data } = await axios.post(
      url,
      { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, redirect_uri: OAUTH_REDIRECT },
      { headers: { Accept: "application/json" } }
    );
    if (!data.access_token) throw new Error("GitHub token exchange failed");
    return data.access_token;
  } catch (error) {
    status = 'failure';
    throw error;
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}

export async function listBranches(token, owner, repo) {
  const operation = 'listBranches';
  let status = 'success';
  try {
    if (!token) throw new Error("Authentication token is required.");
    if (!owner) throw new Error("Repository owner is required.");
    if (!repo) throw new Error("Repository name is required.");

    const { data } = await axios.get(`${GH_API}/repos/${owner}/${repo}/branches?per_page=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.map((b) => ({ name: b.name, protected: b.protected, sha: b.commit.sha }));
  } catch (error) {
    status = 'failure';
    logger.error({ error }, "Error listing branches");
    throw error;
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}

export async function listUserRepos(token) {
  const operation = 'listUserRepos';
  let status = 'success';
  try {
    const { data } = await axios.get(`${GH_API}/user/repos?per_page=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.map((r) => ({ id: r.id, name: r.name, full_name: r.full_name, private: r.private, default_branch: r.default_branch, owner: r.owner.login }));
  } catch (error) {
    status = 'failure';
    throw error;
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}

const VALID_EXTENSIONS = new Set([
  '.js', '.ts', '.tsx',
  '.py',
  '.java',
  '.go',
  '.php',
  '.rb',
  '.cs'
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

const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.pdf', '.zip', '.tar', '.gz', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.class',
  '.lock', '.json-lock',
  '.ttf', '.woff', '.woff2', '.mp4', '.mov', '.avi'
]);

const MAX_LINES = 2000;
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB limit

function isBinaryBuffer(buffer) {
  // Check for null bytes in the first 1024 bytes - a very reliable heuristic for binary files
  const checkLen = Math.min(buffer.length, 1024);
  for (let i = 0; i < checkLen; i++) {
    if (buffer[i] === 0x00) {
      return true;
    }
  }
  return false;
}

function shouldIncludeFile(path, includeIgnored = false) {
  if (includeIgnored) return true;

  // Check ignored paths
  if (IGNORED_PATHS.some(ignored => path.includes(`/${ignored}/`) || path.startsWith(`${ignored}/`) || path === ignored)) {
    return false;
  }

  const extension = path.substring(path.lastIndexOf('.')).toLowerCase();
  
  // Check ignored extensions (binary files, images, etc.)
  if (IGNORED_EXTENSIONS.has(extension)) {
    return false;
  }

  // If we have a whitelist of extensions, strictly follow it?
  // The requirement says "Detect and filter relevant file extensions: .js, .ts, ..."
  // But also "Ignore: binary files, images..."
  // It's safer to whitelist for the purpose of test generation to avoid noise.
  return VALID_EXTENSIONS.has(extension);
}

export async function getRepoTree(token, owner, repo, branch, includeIgnored = false) {
  const operation = 'getRepoTree';
  let status = 'success';
  try {
    if (!token) throw new Error("Authentication token is required.");
    if (!owner) throw new Error("Repository owner is required.");
    if (!repo) throw new Error("Repository name is required.");

    // Get default branch if not provided
    let targetBranch = branch;
    if (!targetBranch) {
      try {
        const repoInfoResponse = await axios.get(`${GH_API}/repos/${owner}/${repo}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });
        targetBranch = repoInfoResponse.data.default_branch;
      } catch (repoInfoErr) {
        logger.warn({ error: repoInfoErr }, "Could not determine default branch");
        targetBranch = 'main'; // Fallback
      }
    }

    const url = `${GH_API}/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`;
    logger.info({ url }, "Fetching repo tree");

    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 20000 // Increase timeout for large trees
    });

    if (data.truncated) {
      logger.warn({ owner, repo }, "Repository tree is truncated");
    }

    const rawFiles = data.tree;
    const filteredFiles = rawFiles.filter(item => {
      if (item.type !== 'blob') return false; // We handle directories implicitly by file paths
      return shouldIncludeFile(item.path, includeIgnored);
    });

    // Convert flat list to tree structure
    const root = { name: "", path: "", type: "folder", children: [] };
    const map = { "": root };

    filteredFiles.forEach(file => {
      const parts = file.path.split('/');
      let currentPath = "";
      
      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!map[currentPath]) {
          const newNode = {
            name: part,
            path: currentPath,
            type: isFile ? "file" : "folder",
            sha: isFile ? file.sha : undefined,
            size: isFile ? file.size : undefined,
            children: isFile ? undefined : []
          };
          map[currentPath] = newNode;
          
          // Add to parent
          const parentNode = map[parentPath];
          if (parentNode) { // Should always be true as we process in order
            parentNode.children.push(newNode);
          }
        }
      });
    });

    // Sort children: folders first, then files, alphabetically
    const sortChildren = (node) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'folder' ? -1 : 1;
        });
        node.children.forEach(sortChildren);
      }
    };
    sortChildren(root);

    return root.children; // Return array of root items
  } catch (error) {
    status = 'failure';
    logger.error({ error }, "Error fetching repo tree");
    throw error;
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}

export async function listRepoFiles(token, owner, repo, path = "") {
  const operation = 'listRepoFiles';
  let status = 'success';
  try {
    if (!token) throw new Error("Authentication token is required.");
    if (!owner) throw new Error("Repository owner is required.");
    if (!repo) throw new Error("Repository name is required.");
    
    // Normalize path - remove leading/trailing slashes
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    
    // Get default branch to improve success rate
    let defaultBranch = null;
    try {
      const repoInfoResponse = await axios.get(`${GH_API}/repos/${owner}/${repo}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      defaultBranch = repoInfoResponse.data.default_branch;
    } catch (repoInfoErr) {
      logger.warn({ error: repoInfoErr }, "Could not determine default branch");
      // Continue with default approach
    }
    
    // Try to get the directory contents
    try {
      const url = `${GH_API}/repos/${owner}/${repo}/contents/${normalizedPath}`;
      logger.info({ url }, "Fetching repo files");
      
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      // Normalize response
      const items = Array.isArray(data) ? data : [data];
      
      // Return both files and directories with type information
      return items.map((i) => ({ 
        path: i.path, 
        name: i.name, 
        type: i.type, // Include type to distinguish files from directories
        sha: i.sha, 
        download_url: i.download_url,
        size: i.size
      }));
    } catch (directErr) {
      logger.debug({ error: directErr }, "Direct contents fetch failed");
      
      // If the default approach fails, try with the default branch explicitly
      if (defaultBranch) {
        try {
          const branchUrl = `${GH_API}/repos/${owner}/${repo}/contents/${normalizedPath}?ref=${defaultBranch}`;
          logger.info({ url: branchUrl }, "Trying with explicit branch");
          
          const branchResponse = await axios.get(branchUrl, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          });
          
          const branchItems = Array.isArray(branchResponse.data) ? branchResponse.data : [branchResponse.data];
          
          return branchItems.map((i) => ({ 
            path: i.path, 
            name: i.name, 
            type: i.type,
            sha: i.sha, 
            download_url: i.download_url,
            size: i.size
          }));
        } catch (branchErr) {
          logger.debug({ error: branchErr }, "Branch-specific fetch failed");
        }
      }
      
      // As a last resort, try to get the tree
      try {
        const refBranch = defaultBranch || 'master';
        const treeUrl = `${GH_API}/repos/${owner}/${repo}/git/trees/${refBranch}:${normalizedPath}`;
        logger.info({ url: treeUrl }, "Trying tree API");
        
        const treeResponse = await axios.get(treeUrl, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        
        if (treeResponse.data && treeResponse.data.tree) {
          return treeResponse.data.tree.map(item => ({
            path: normalizedPath ? `${normalizedPath}/${item.path}` : item.path,
            name: item.path,
            type: item.type === 'blob' ? 'file' : 'dir',
            sha: item.sha,
            download_url: item.type === 'blob' ? 
              `https://raw.githubusercontent.com/${owner}/${repo}/${refBranch}/${normalizedPath ? `${normalizedPath}/` : ''}${item.path}` : 
              null,
            size: item.size
          }));
        }
      } catch (treeErr) {
        logger.debug({ error: treeErr }, "Tree API fetch failed");
      }
      
      // If all attempts fail, throw the original error
      throw directErr;
    }
  } catch (error) {
    status = 'failure';
    logger.error({ error }, "Error listing repo files");
    throw error;
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}

export async function fetchRepoFileContent(token, owner, repo, path) {
  const operation = 'fetchRepoFileContent';
  let status = 'success';
  try {
    if (!path) throw new Error("Path is required to fetch file content.");
    if (!owner) throw new Error("Repository owner is required.");
    if (!repo) throw new Error("Repository name is required.");
    if (!token) throw new Error("Authentication token is required.");
    
    // Validate owner and repo parameters
    if (typeof owner !== 'string' || owner.trim() === '') throw new Error("Invalid repository owner provided.");
    if (typeof repo !== 'string' || repo.trim() === '') throw new Error("Invalid repository name provided.");
    
    // Use the provided owner and repo directly
    const actualOwner = owner.trim();
    const actualRepo = repo.trim();
    
    // Clean the path - remove any leading slashes and normalize
    const cleanPath = path.replace(/^[\/\\]+/, '');
    logger.info({ owner: actualOwner, repo: actualRepo, originalPath: path, cleanPath }, "Fetching file");

    // Check extension first
    const extension = cleanPath.substring(cleanPath.lastIndexOf('.')).toLowerCase();
    if (IGNORED_EXTENSIONS.has(extension)) {
      throw new Error(`Binary file cannot be analyzed (extension: ${extension}).`);
    }
    
    // Get default branch first to improve success rate
    let defaultBranch = null;
    try {
      const repoInfoResponse = await axios.get(`${GH_API}/repos/${actualOwner}/${actualRepo}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      defaultBranch = repoInfoResponse.data.default_branch;
      logger.info({ owner: actualOwner, repo: actualRepo, branch: defaultBranch }, "Default branch determined");
    } catch (repoInfoErr) {
      logger.warn({ error: repoInfoErr }, "Could not determine default branch");
      // Continue with fallback branches if we can't get the default branch
    }
    
    // Define branches to try, starting with default branch if available
    const branches = defaultBranch 
      ? [defaultBranch, 'master', 'main', 'dev', 'development'] 
      : ['master', 'main', 'dev', 'development'];
    
    // Remove duplicates in case default branch is one of our fallbacks
    const uniqueBranches = [...new Set(branches)];

    // Helper to process response data
    const processResponseData = (data) => {
      let buffer;
      if (Buffer.isBuffer(data)) {
        buffer = data;
      } else if (typeof data === 'string') {
        buffer = Buffer.from(data);
      } else if (typeof data === 'object') {
        // Handle potential JSON response if something goes wrong with arraybuffer
        buffer = Buffer.from(JSON.stringify(data));
      } else {
        buffer = Buffer.from(String(data));
      }

      // Check size
      if (buffer.length > MAX_SIZE_BYTES) {
        throw new Error(`TOO_LARGE: File exceeds size limit (${(buffer.length / 1024 / 1024).toFixed(2)}MB > 2MB).`);
      }

      // Check if empty
      if (buffer.length === 0) {
        throw new Error("EMPTY_FILE: File is empty.");
      }

      if (isBinaryBuffer(buffer)) {
        throw new Error("BINARY_FILE: Cannot analyze binary content.");
      }
      
      const content = buffer.toString('utf8');

      if (content.trim().length === 0) {
        throw new Error("EMPTY_FILE: File is empty (whitespace only).");
      }

      // Check line count
      const lineCount = content.split('\n').length;
      if (lineCount > MAX_LINES) {
        throw new Error(`TOO_LARGE: File exceeds line count limit (${lineCount} > ${MAX_LINES}).`);
      }
      
      // Check for replacement character U+FFFD which indicates decoding errors
      if (content.includes('\ufffd')) {
        throw new Error("BINARY_FILE: This file cannot be analyzed (unreadable characters).");
      }

      return content;
    };
    
    // First try direct API approach with the content API
    try {
      const response = await axios.get(`${GH_API}/repos/${actualOwner}/${actualRepo}/contents/${cleanPath}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3.raw" // Request raw content
        },
        responseType: 'arraybuffer', // Get raw buffer to check for binary
        timeout: 10000,
        maxContentLength: MAX_SIZE_BYTES
      });
      
      return processResponseData(response.data);
    } catch (directErr) {
      // If it's the binary error we just threw, rethrow it
      if (directErr.message.startsWith("BINARY_FILE") || directErr.message.startsWith("TOO_LARGE") || directErr.message.startsWith("EMPTY_FILE")) {
        throw directErr;
      }

      logger.debug({ error: directErr }, "Direct API approach failed");
      
      // If it's a 404 or other error, try with specific branches
      for (const branch of uniqueBranches) {
        try {
          logger.info({ branch }, "Trying branch");
          const branchResponse = await axios.get(`${GH_API}/repos/${actualOwner}/${actualRepo}/contents/${cleanPath}?ref=${branch}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3.raw"
            },
            responseType: 'arraybuffer',
            timeout: 10000,
            maxContentLength: MAX_SIZE_BYTES
          });
          
          return processResponseData(branchResponse.data);
        } catch (branchErr) {
           if (branchErr.message.startsWith("BINARY_FILE") || branchErr.message.startsWith("TOO_LARGE") || branchErr.message.startsWith("EMPTY_FILE")) {
            throw branchErr;
          }
          logger.debug({ branch, error: branchErr }, "Branch attempt failed");
          // Continue to next branch
        }
      }
      
      // If all branch attempts fail, try the raw GitHub URL as a fallback
      for (const branch of uniqueBranches) {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${actualOwner}/${actualRepo}/${branch}/${cleanPath}`;
          logger.info({ url: rawUrl }, "Trying raw URL");
          
          const rawResponse = await axios.get(rawUrl, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer',
            timeout: 8000,
            maxContentLength: MAX_SIZE_BYTES
          });
          
          if (rawResponse.status === 200) {
            return processResponseData(rawResponse.data);
          }
        } catch (rawBranchErr) {
           if (rawBranchErr.message.startsWith("BINARY_FILE") || rawBranchErr.message.startsWith("TOO_LARGE") || rawBranchErr.message.startsWith("EMPTY_FILE")) {
            throw rawBranchErr;
          }
          logger.debug({ branch, error: rawBranchErr }, "Raw URL with branch failed");
          // Continue to next branch
        }
      }
      
      // If we've tried everything and still failed, try the blob API as a last resort
      try {
        // Get the file reference from the default branch
        const refBranch = defaultBranch || 'master';
        const treeResponse = await axios.get(
          `${GH_API}/repos/${actualOwner}/${actualRepo}/git/trees/${refBranch}?recursive=1`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );
        
        // Find the file in the tree
        const fileEntry = treeResponse.data.tree.find(item => 
          item.type === 'blob' && 
          (item.path === cleanPath || item.path.endsWith(`/${cleanPath}`))
        );
        
        if (fileEntry && fileEntry.sha) {
          // Get the blob content
          const blobResponse = await axios.get(
            `${GH_API}/repos/${actualOwner}/${actualRepo}/git/blobs/${fileEntry.sha}`,
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3.raw"
              },
              responseType: 'arraybuffer',
              timeout: 10000,
              maxContentLength: MAX_SIZE_BYTES
            }
          );
          
          return processResponseData(blobResponse.data);
        }
      } catch (blobErr) {
         if (blobErr.message.startsWith("BINARY_FILE") || blobErr.message.startsWith("TOO_LARGE") || blobErr.message.startsWith("EMPTY_FILE")) {
            throw blobErr;
          }
        logger.debug({ error: blobErr }, "Blob API approach failed");
      }
      
      // If all attempts fail, throw the original error
      throw directErr;
    }
    
    status = 'failure';
    throw new Error(`File not found: ${path}. Could not locate the file in the repository.`);
  } catch (error) {
    status = 'failure';
    logger.error({ error }, "Error fetching file content");
    throw error;
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}

export async function createBranch(token, owner, repo, base, branch) {
  const operation = 'createBranch';
  let status = 'success';
  try {
    const { data: baseRef } = await axios.get(`${GH_API}/repos/${owner}/${repo}/git/ref/heads/${base}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { data: newRef } = await axios.post(
      `${GH_API}/repos/${owner}/${repo}/git/refs`,
      { ref: `refs/heads/${branch}`, sha: baseRef.object.sha },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return newRef;
  } catch (error) {
    status = 'failure';
    throw error;
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}

export async function createOrUpdateFiles(token, owner, repo, branch, files) {
  const operation = 'createOrUpdateFiles';
  let status = 'success';
  try {
    // files: [{ path, content, message }]
    for (const f of files) {
      const contentB64 = Buffer.from(f.content, "utf8").toString("base64");
      await axios.put(
        `${GH_API}/repos/${owner}/${repo}/contents/${f.path}`,
        { message: f.message || `add ${f.path}`, content: contentB64, branch },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
  } catch (error) {
    status = 'failure';
    throw error;
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}

export async function openPullRequest(token, owner, repo, base, head, title, body) {
  const operation = 'openPullRequest';
  let status = 'success';
  try {
    const { data } = await axios.post(
      `${GH_API}/repos/${owner}/${repo}/pulls`,
      { base, head, title: title || "Add AI-generated tests", body: body || "This PR adds tests." },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (error) {
    status = 'failure';
    throw error;
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}

export async function createPullRequestWithFiles({ token, owner, repo, base, branch, title, body, files }) {
  const operation = 'createPullRequestWithFiles';
  let status = 'success';
  try {
    await createBranch(token, owner, repo, base, branch);
    await createOrUpdateFiles(token, owner, repo, branch, files);
    const pr = await openPullRequest(token, owner, repo, base, branch, title, body);
    return pr;
  } catch (error) {
    status = 'failure';
    throw error;
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}

export async function fetchContextFiles(token, owner, repo, currentFilePath, imports) {
  const operation = 'fetchContextFiles';
  let status = 'success';
  try {
    // 1. Filter for relative imports only
    const relativeImports = imports.filter(imp => imp.startsWith('.') || imp.startsWith('/'));
    
    if (relativeImports.length === 0) return [];

    // 2. Resolve paths
    const dir = path.posix.dirname(currentFilePath);
    const uniquePaths = new Set();
    
    relativeImports.forEach(imp => {
      let resolved = path.posix.join(dir, imp);
      // Remove leading / if present (GitHub API doesn't like it for content paths usually)
      if (resolved.startsWith('/')) resolved = resolved.slice(1);
      uniquePaths.add(resolved);
    });

    // 3. Limit to top 5 to avoid perf issues
    const pathsToFetch = Array.from(uniquePaths).slice(0, 5);
    
    logger.info({ currentFilePath, pathsToFetch }, "Fetching context files");

    const contextFiles = [];
    
    for (const p of pathsToFetch) {
      // Try to fetch. We need to handle extensions (.js, .ts, .jsx, .tsx) if missing
      // Simple heuristic: try original, then extensions
      const extensions = ['', '.js', '.ts', '.jsx', '.tsx', '/index.js', '/index.ts'];
      
      for (const ext of extensions) {
        const tryPath = p + ext;
        try {
           // We reuse fetchRepoFileContent but we need to be careful about not throwing too hard if not found
           const content = await fetchRepoFileContent(token, owner, repo, tryPath);
           contextFiles.push({
             path: tryPath,
             content,
             name: tryPath.split('/').pop()
           });
           break; // Found it
        } catch (e) {
          // Ignore not found and try next extension
        }
      }
    }

    return contextFiles;

  } catch (error) {
    status = 'failure';
    logger.error({ error }, "Error fetching context files");
    return []; // Return empty on error to not break main flow
  } finally {
    githubServiceCallCounter.inc({ operation, status });
  }
}
