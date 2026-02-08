// src/controllers/testcase.controller.js
import * as aiService from "../services/ai.service.js";
import * as tcService from "../services/testcase.service.js";
// Removed direct import of getRepoFileContent from github.controller.js
import * as githubService from "../services/github.service.js";
import * as testRunnerService from "../services/testRunner.service.js";
import { analyzeCodeFile } from "../services/codeAnalyzer.service.js";
import { logResourceEvent } from "../services/audit.service.js";
import * as logger from "../utils/logger.js";

export default function testcaseControllerFactory(db) {
  async function generateSummaries(req, res, next) {
    const db = req.app.locals.db;
    const userId = req.user ? req.user.id : null;
    try {
      const { files: filePaths } = req.body;
      let repo = req.body.repo;

      // Harmonize repo shape: accept { owner, repo } by mapping repo->name
      if (repo && repo.repo && !repo.name) {
        repo.name = repo.repo;
        req.body.repo = repo;
      }

      // Validate input
      if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
        const error = new Error('No files provided for analysis');
        error.statusCode = 400;
        throw error;
      }

      // Validate repository information before making the API request
      if (!repo || !repo.owner || !repo.name) {
        // Check if repo object exists but is missing properties
        if (repo) {
          // If repo exists but owner or name is missing, try to extract from URL or path
          if (req.headers.referer) {
            const urlMatch = req.headers.referer.match(/\/repos\/([^\/]+)\/([^\/]+)/);
            if (urlMatch && urlMatch.length >= 3) {
              req.body.repo = {
                owner: urlMatch[1],
                name: urlMatch[2]
              };
              repo = req.body.repo;
            }
          }
        }
        
        // If still missing repo info and we have at least one file path, try to extract from path
        if ((!repo || !repo.owner || !repo.name) && filePaths.length > 0) {
          const firstPath = typeof filePaths[0] === 'object' ? filePaths[0].path : filePaths[0];
          if (firstPath) {
            const pathParts = firstPath.split('/');
            if (pathParts.length >= 2) {
              // Update both req.body.repo and local repo variable
              req.body.repo = {
                owner: pathParts[0],
                name: pathParts[1]
              };
              // Update the local repo variable to use the new values
              repo = req.body.repo;
            }
          }
        }
        
        // If still missing repo info, try to extract from the request URL
        if (!repo || !repo.owner || !repo.name) {
          if (req.originalUrl) {
            const apiUrlMatch = req.originalUrl.match(/\/api\/v1\/([^\/]+)\/([^\/]+)/);
            if (apiUrlMatch && apiUrlMatch.length >= 3) {
              req.body.repo = {
                owner: apiUrlMatch[1],
                name: apiUrlMatch[2]
              };
              repo = req.body.repo;
            }
          }
        }
        
        // If we still don't have valid repo info, return an error
        if (!repo || !repo.owner || !repo.name) {
          const error = new Error('Invalid repository information. Owner and name are required.');
          error.statusCode = 400;
          throw error;
        }
      }
      
      // Ensure owner and name are strings and properly trimmed
      if (repo && repo.owner && repo.name) {
        repo.owner = String(repo.owner).trim();
        repo.name = String(repo.name).trim();
      }

      // Fetch content for each file with better error handling
      const filesWithContent = [];
      const failedFiles = [];
      
      for (const filePath of filePaths) {
        try {
          // Ensure we're extracting the path string correctly
          const path = typeof filePath === 'object' && filePath.path ? filePath.path : 
                      typeof filePath === 'string' ? filePath : '';
          
          // Make sure we have a valid path before making the API request
          if (!path) {
            failedFiles.push({ path: filePath, error: 'Invalid file path provided' });
            continue;
          }
          
          // Log the file path being processed for debugging
          logger.debug(`Processing file path: ${path}, repo: ${JSON.stringify(repo)}`);
          
          // Use the path directly as it comes from the recursive tree (which returns paths relative to repo root)
          // We trust the repo object provided in the request body.
          const cleanPath = path;
          
          logger.debug(`Using clean path: ${cleanPath}`);
          logger.debug(`Fetching file content with: token=${req.githubToken ? 'present' : 'missing'}, owner=${repo.owner}, repo=${repo.name}, path=${cleanPath}`);
          const fileContent = await githubService.fetchRepoFileContent(req.githubToken, repo.owner, repo.name, cleanPath);
          filesWithContent.push({ path, content: fileContent, name: cleanPath.split('/').pop() });
        } catch (fileError) {
          // Add to failed files list but continue processing other files
          failedFiles.push({ 
            path: typeof filePath === 'object' ? filePath.path : filePath, 
            error: fileError.message 
          });
        }
      }

      // If no files were successfully fetched, return an error
      if (filesWithContent.length === 0) {
        const error = new Error('Could not fetch any of the requested files. Please check file paths and repository access.');
        error.statusCode = 404;
        error.failedFiles = failedFiles;
        throw error;
      }

      // Perform deeper code analysis for each file
      const enrichedFiles = await Promise.all(filesWithContent.map(async (file) => {
        const analysis = await analyzeCodeFile(file);
        return { ...file, analysis };
      }));

      const summaries = await aiService.generateTestCaseSummaries({ files: enrichedFiles, repo, user: req.user });
      logResourceEvent(userId, 'READ', 'CodebaseAnalysis', null, 'SUCCESS', { 
        files: filesWithContent.length, 
        failedFiles: failedFiles.length,
        repo: repo.name 
      });
      
      // Include information about failed files in the response
      res.status(200).json({ 
        summaries,
        failedFiles: failedFiles.length > 0 ? failedFiles : undefined,
        message: failedFiles.length > 0 ? `${failedFiles.length} files could not be processed` : undefined
      });
    } catch (e) {
      // Add status code if not present
      if (!e.statusCode) {
        e.statusCode = 500;
      }
      
      logResourceEvent(userId, 'READ', 'CodebaseAnalysis', null, 'FAILURE', { error: e.message });
      
      // Send a structured error response
      res.status(e.statusCode).json({
        error: true,
        message: e.message,
        failedFiles: e.failedFiles || undefined,
        code: e.statusCode
      });
    }
  }

  async function generateCode(req, res, next) {
    const userId = req.user ? req.user.id : null;
    try {
      const { summaryId, files: filePaths, framework, mode = 'test' } = req.body;

      // Fetch content for the file associated with the summaryId
      const targetFile = filePaths.find(f => {
        const filePath = typeof f === 'object' && f.path ? f.path : 
                        typeof f === 'string' ? f : '';
        return filePath === summaryId;
      });
      
      if (!targetFile) {
        logResourceEvent(userId, 'CREATE', 'TestCodeGeneration', null, 'FAILURE', { reason: "Target file for summary not found.", summaryId });
        return res.status(400).json({ error: "Target file for summary not found." });
      }
      
      // Extract the path string correctly
      const targetPath = typeof targetFile === 'object' && targetFile.path ? targetFile.path : 
                        typeof targetFile === 'string' ? targetFile : '';
                        
      if (!targetPath) {
        logResourceEvent(userId, 'CREATE', 'TestCodeGeneration', null, 'FAILURE', { reason: "Invalid file path format.", summaryId });
        return res.status(400).json({ error: "Invalid file path format." });
      }

      // Validate repository information before making the API request
      if (!req.body.repo || !req.body.repo.owner || !req.body.repo.name) {
        // Extract owner and repo name from the path if possible
        const pathParts = targetPath.split('/');
        if (pathParts.length >= 2) {
          req.body.repo = {
            owner: pathParts[0],
            name: pathParts[1]
          };
        } else {
          throw new Error('Invalid repository information. Owner and name are required.');
        }
      }
      
      try {
        const fileContent = await githubService.fetchRepoFileContent(req.githubToken, req.body.repo.owner, req.body.repo.name, targetPath);
        const fileWithContent = { ...targetFile, content: fileContent };

        // Context Awareness: Analyze imports and fetch related files
        let contextFiles = [];
        try {
          const analysis = await analyzeCodeFile(fileWithContent);
          if (analysis && analysis.extractedElements && analysis.extractedElements.imports && analysis.extractedElements.imports.length > 0) {
            logger.debug(`Found imports for context: ${analysis.extractedElements.imports.join(', ')}`);
            contextFiles = await githubService.fetchContextFiles(
              req.githubToken,
              req.body.repo.owner,
              req.body.repo.name,
              targetPath,
              analysis.extractedElements.imports
            );
            logger.debug(`Successfully fetched ${contextFiles.length} context files.`);
          }
        } catch (contextErr) {
          logger.warn(`Failed to fetch context files: ${contextErr.message}`);
          // Continue without context
        }

        const { code, filename, language } = await aiService.generateTestCode({
          summaryId, files: [fileWithContent], framework, user: req.user, contextFiles, mode
        });
        logResourceEvent(userId, 'CREATE', 'TestCodeGeneration', summaryId, 'SUCCESS', { filename, language, framework, contextFilesCount: contextFiles.length, mode });
        res.status(200).json({ code, filename, language });
      } catch (fileError) {
        // Handle file not found errors specifically
        if (fileError.message && fileError.message.includes('File not found')) {
          logResourceEvent(userId, 'CREATE', 'TestCodeGeneration', null, 'FAILURE', { error: fileError.message, targetPath });
          return res.status(500).json({ error: fileError.message });
        }
        throw fileError; // Re-throw other errors to be caught by the outer catch block
      }
    } catch (e) {
      logResourceEvent(userId, 'CREATE', 'TestCodeGeneration', null, 'FAILURE', { error: e.message });
      next(e);
    }
  }

  async function executeTests(req, res, next) {
    const userId = req.user ? req.user.id : null;
    try {
      const { testCode, sourceCode, language, framework } = req.body;

      if (!testCode || !sourceCode || !language || !framework) {
        logResourceEvent(userId, 'EXECUTE', 'Tests', null, 'FAILURE', { reason: "Missing parameters", language, framework });
        return res.status(400).json({ error: "Missing testCode, sourceCode, language, or framework." });
      }

      const results = await testRunnerService.runTests({ testCode, sourceCode, language, framework });
      logResourceEvent(userId, 'EXECUTE', 'Tests', null, 'SUCCESS', { language, framework, totalTests: results.summary.total, passedTests: results.summary.passed });

      // Transform results to match TestSprite's expected format
      const transformedResults = {
        ...results,
        testCaseResults: results.results.map(test => ({
          ...test,
          testStatus: test.status // Rename 'status' to 'testStatus'
        }))
      };
      res.status(200).json(transformedResults);
    } catch (e) {
      logResourceEvent(userId, 'EXECUTE', 'Tests', null, 'FAILURE', { error: e.message });
      next(e);
    }
  }

  // Optional persistence CRUD

  async function create(req, res, next) {
    const userId = req.user ? req.user.id : null;
    try {
      const record = await tcService.create(db, req.body, userId);
      logResourceEvent(userId, 'CREATE', 'TestCase', record.id, 'SUCCESS');
      res.status(201).json(record);
    } catch (e) {
      logResourceEvent(userId, 'CREATE', 'TestCase', null, 'FAILURE', { error: e.message, details: req.body });
      next(e);
    }
  }

  async function list(_req, res, next) {
    const userId = _req.user ? _req.user.id : null;
    try {
      const items = await tcService.list(db);
      logResourceEvent(userId, 'READ_ALL', 'TestCase', null, 'SUCCESS', { count: items.length });
      res.status(200).json(items);
    } catch (e) {
      logResourceEvent(userId, 'READ_ALL', 'TestCase', null, 'FAILURE', { error: e.message });
      next(e);
    }
  }

  async function getById(req, res, next) {
    const userId = req.user ? req.user.id : null;
    try {
      const item = await tcService.getById(db, req.params.id);
      if (!item) {
        logResourceEvent(userId, 'READ', 'TestCase', req.params.id, 'FAILURE', { reason: "Not found" });
        return res.status(404).json({ error: "Not found" });
      }
      logResourceEvent(userId, 'READ', 'TestCase', req.params.id, 'SUCCESS');
      res.status(200).json(item);
    } catch (e) {
      logResourceEvent(userId, 'READ', 'TestCase', req.params.id, 'FAILURE', { error: e.message });
      next(e);
    }
  }

  async function update(req, res, next) {
    const userId = req.user ? req.user.id : null;
    try {
      const item = await tcService.update(db, req.params.id, req.body);
      logResourceEvent(userId, 'UPDATE', 'TestCase', req.params.id, 'SUCCESS', { updatedFields: Object.keys(req.body) });
      res.status(200).json(item);
    } catch (e) {
      logResourceEvent(userId, 'UPDATE', 'TestCase', req.params.id, 'FAILURE', { error: e.message, details: req.body });
      next(e);
    }
  }

  async function remove(req, res, next) {
    const userId = req.user ? req.user.id : null;
    try {
      await tcService.remove(db, req.params.id);
      logResourceEvent(userId, 'DELETE', 'TestCase', req.params.id, 'SUCCESS');
      res.status(204).end();
    } catch (e) {
      logResourceEvent(userId, 'DELETE', 'TestCase', req.params.id, 'FAILURE', { error: e.message });
      next(e);
    }
  }

  // Real AI test generation is handled by generateSummaries and generateCode functions

  return {
    generateSummaries,
    generateCode,
    executeTests,
    create,
    list,
    getById,
    update,
    remove
  };
}
