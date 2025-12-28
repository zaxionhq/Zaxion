import { useState, useCallback } from 'react';
import { FileNode } from '@/components/FileTree';
import { TestSummary } from '@/components/TestSummaryCard';
import { api, ApiError } from '@/lib/api';
import { useApiErrorHandler } from '@/components/ErrorToast';

// Types for GitHub API responses
export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  private: boolean;
  description?: string;
  default_branch?: string;
}

export interface GitHubBranch {
  name: string;
  protected: boolean;
  sha: string;
}

// Interface for backend summary response
interface BackendTestSummary {
  filePath?: string;
  path?: string;
  file?: string;
  fileName?: string;
  estimatedTests?: number;
  complexity?: 'low' | 'medium' | 'high';
  language?: string;
  summary?: string;
  brief?: string;
  testTypes?: string[];
  keyFunctions?: string[];
}

const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': return 'TypeScript';
    case 'tsx': return 'React';
    case 'js': return 'JavaScript';
    case 'jsx': return 'React';
    case 'py': return 'Python';
    case 'java': return 'Java';
    case 'go': return 'Go';
    case 'php': return 'PHP';
    case 'rb': return 'Ruby';
    case 'cs': return 'C#';
    default: return 'Unknown';
  }
};

const generateMockSummary = (file: { name: string, path: string }): TestSummary => {
  const summaries = {
    'UserService.ts': {
      summary: 'Test user authentication, profile updates, password validation, and error handling for invalid credentials. Include edge cases for malformed data and API timeouts.',
      testTypes: ['Unit Tests', 'Integration Tests', 'Error Handling'],
      complexity: 'medium' as const,
      estimatedTests: 12
    },
    'LoginForm.tsx': {
      summary: 'Test form validation, submission handling, loading states, error displays, and accessibility features. Verify proper React component behavior.',
      testTypes: ['Component Tests', 'User Interaction', 'Accessibility'],
      complexity: 'low' as const,
      estimatedTests: 8
    },
    'utils.js': {
      summary: 'Test utility functions for data formatting, validation helpers, and string manipulations. Focus on edge cases and boundary conditions.',
      testTypes: ['Unit Tests', 'Edge Cases'],
      complexity: 'low' as const,
      estimatedTests: 6
    },
    'api.py': {
      summary: 'Test API endpoints, request/response handling, authentication middleware, and database interactions. Include performance and security tests.',
      testTypes: ['API Tests', 'Security Tests', 'Performance'],
      complexity: 'high' as const,
      estimatedTests: 18
    },
    'DatabaseManager.java': {
      summary: 'Test database connections, CRUD operations, transaction handling, and connection pooling. Include tests for concurrent access and error recovery.',
      testTypes: ['Integration Tests', 'Concurrency', 'Error Recovery'],
      complexity: 'high' as const,
      estimatedTests: 15
    }
  };

  const defaultSummary = {
    summary: 'Comprehensive test coverage including unit tests, integration tests, and edge case handling.',
    testTypes: ['Unit Tests', 'Integration Tests'],
    complexity: 'medium' as const,
    estimatedTests: 10
  };

  const mock = summaries[file.name as keyof typeof summaries] || defaultSummary;

  return {
    id: `summary-${file.path}`,
    fileName: file.name,
    filePath: file.path,
    language: getLanguageFromPath(file.path),
    ...mock
  };
};

const generateMockTestCode = (summary: TestSummary): string => {
  const templates: Record<string, string> = {
    'TypeScript': `import { UserService } from '../services/UserService';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('UserService', () => {
  let userService: UserService;
  let mockApiClient: jest.Mocked<any>;

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    userService = new UserService(mockApiClient);
  });

  describe('authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      // Arrange
      const credentials = { email: 'user@example.com', password: 'password123' };
      const expectedUser = { id: 1, email: 'user@example.com', name: 'John Doe' };
      mockApiClient.post.mockResolvedValue({ data: expectedUser });

      // Act
      const result = await userService.authenticate(credentials);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
    });
  });
});`,

    'React': `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../components/LoginForm';

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
    loading: false,
    error: null,
  };

  it('renders login form with all required fields', () => {
    render(<LoginForm {...defaultProps} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});`,

    'JavaScript': `import { validateEmail, formatCurrency, debounce } from '../utils/utils';

describe('Utility Functions', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });
  });
});`,

    'Python': `import pytest
from fastapi.testclient import TestClient
from api import app

client = TestClient(app)

class TestAPI:
    def test_health_check(self):
        """Test the health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}`,

    'Java': `import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class DatabaseManagerTest {
    @Test
    @DisplayName("Should create user successfully")
    void shouldCreateUserSuccessfully() {
        // Test implementation
        assertTrue(true);
    }
}`
  };

  return templates[summary.language] || templates['JavaScript'];
};

// Helper to find a file node in the tree by path
const findFileInTree = (nodes: FileNode[], path: string): FileNode | null => {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findFileInTree(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

export const useTestGeneration = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [files, setFiles] = useState<FileNode[]>([]); // Now stores the tree
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]); // Stores paths
  const [testSummaries, setTestSummaries] = useState<TestSummary[]>([]);
  const [isGeneratingSummaries, setIsGeneratingSummaries] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<{
    summary: TestSummary;
    code: string;
    language: string;
  } | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  
  // Error states
  const [reposError, setReposError] = useState<string | null>(null);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [summariesError, setSummariesError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [prError, setPrError] = useState<string | null>(null);
  const [failedFiles, setFailedFiles] = useState<{ path: string; error: string }[]>([]);
  const [showIgnored, setShowIgnored] = useState(false);
  
  // Retry counts
  const [reposRetryCount, setReposRetryCount] = useState(0);
  const [filesRetryCount, setFilesRetryCount] = useState(0);
  const [summariesRetryCount, setSummariesRetryCount] = useState(0);
  const [codeRetryCount, setCodeRetryCount] = useState(0);
  const [prRetryCount, setPrRetryCount] = useState(0);

  const { handleError, handleSuccess, handleWarning } = useApiErrorHandler();

  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  // Note: selectAllFiles and clearAllFiles might need adjustment for tree structure
  // For now we'll keep clearAllFiles as is.
  // selectAllFiles would need to traverse the tree to get all file paths.
  
  const clearAllFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const selectAllFiles = useCallback(() => {
      const getAllFilePaths = (nodes: FileNode[]): string[] => {
          let paths: string[] = [];
          for (const node of nodes) {
              if (node.type === 'file') {
                  paths.push(node.path);
              } else if (node.children) {
                  paths = paths.concat(getAllFilePaths(node.children));
              }
          }
          return paths;
      };
      setSelectedFiles(getAllFilePaths(files));
  }, [files]);

  // Load user's GitHub repositories
  const loadRepos = useCallback(async (isRetry = false) => {
    setIsLoadingRepos(true);
    setReposError(null);
    setSelectedRepo(null);
    
    if (isRetry) {
      setReposRetryCount(prev => prev + 1);
    }
    
    try {
      console.log('[useTestGeneration] Loading GitHub repositories from /v1/github/repos');
      const reposData = await api.get<GitHubRepo[]>('/v1/github/repos');
      console.log('[useTestGeneration] Repositories loaded successfully:', reposData);
      setRepos(reposData);
      setReposRetryCount(0);
      handleSuccess('Repositories loaded successfully');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('[useTestGeneration] Failed to load repositories:', apiError);
      
      if (apiError.status === 0 || apiError.status === 404 || apiError.message?.includes('Backend not available')) {
        console.info('[useTestGeneration] Using mock repositories in demo mode');
        const mockRepos: GitHubRepo[] = [
          {
            id: 1,
            name: 'demo-repo',
            full_name: 'demo-user/demo-repo',
            owner: { login: 'demo-user' },
            private: false,
            description: 'A demo repository for testing'
          },
          {
            id: 2,
            name: 'test-project',
            full_name: 'demo-user/test-project',
            owner: { login: 'demo-user' },
            private: true,
            description: 'A private test project'
          }
        ];
        setRepos(mockRepos);
        setReposRetryCount(0);
        handleSuccess('Demo repositories loaded');
      } else {
        setReposError(apiError.message || 'Failed to load repositories');
        if (!isRetry) {
          handleError(apiError, () => loadRepos(true));
        }
      }
    } finally {
      setIsLoadingRepos(false);
    }
  }, [handleError, handleSuccess]);

  // Load branches for a repository
  const loadBranches = useCallback(async (repo: GitHubRepo) => {
    if (!repo) return;
    
    setIsLoadingBranches(true);
    setBranchesError(null);
    
    try {
      console.log(`[useTestGeneration] Loading branches for ${repo.owner.login}/${repo.name}`);
      const branchesData = await api.get<GitHubBranch[]>(`/v1/github/repos/${repo.owner.login}/${repo.name}/branches`);
      setBranches(branchesData);
      
      // Set default branch if available and not already selected
      if (repo.default_branch && !selectedBranch) {
        setSelectedBranch(repo.default_branch);
      } else if (branchesData.length > 0 && !selectedBranch) {
        setSelectedBranch(branchesData[0].name);
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to load branches:', apiError);
      setBranchesError(apiError.message || 'Failed to load branches');
      
      // Fallback for demo mode
      if (apiError.status === 0 || apiError.message?.includes('Backend not available')) {
        setBranches([
          { name: 'main', protected: true, sha: 'mock-sha-1' },
          { name: 'develop', protected: false, sha: 'mock-sha-2' },
          { name: 'feature/test-gen', protected: false, sha: 'mock-sha-3' }
        ]);
        if (!selectedBranch) setSelectedBranch('main');
      }
    } finally {
      setIsLoadingBranches(false);
    }
  }, [selectedBranch]);

  // Load files from selected repository (Recursive Tree)
  const loadFiles = useCallback(async (repo: GitHubRepo, branch?: string, isRetry = false, includeIgnored: boolean = showIgnored) => {
    setIsLoadingFiles(true);
    setFilesError(null);
    setSelectedRepo(repo);
    
    if (branch) {
      setSelectedBranch(branch);
    }
    
    const targetBranch = branch || selectedBranch || repo.default_branch || 'main';
    
    if (isRetry) {
      setFilesRetryCount(prev => prev + 1);
    }
    
    try {
      if (!repo || !repo.owner || !repo.owner.login || !repo.name) {
        throw new Error('Invalid repository data. Missing required fields.');
      }
      
      // Use the new tree endpoint with branch param
      const treeData = await api.get<FileNode[]>(
        `/v1/github/repos/${repo.owner.login}/${repo.name}/tree?branch=${targetBranch}&includeIgnored=${includeIgnored}`
      );
      
      setFiles(treeData);
      setSelectedRepo(repo);
      setSelectedFiles([]); // Clear previously selected files
      setFilesRetryCount(0);
      handleSuccess(`Loaded file tree from ${repo.name} (${targetBranch})`);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to load files:', apiError);
      
      if (apiError.status === 404) {
        const errorMessage = 'Repository not found or you don\'t have access to it.';
        console.warn(errorMessage);
        setFilesError(errorMessage);
      } else {
        setFilesError(apiError.message || 'Failed to load files');
      }
      
      // Fallback to mock data
      if (apiError.status === 0 || apiError.message?.includes('Backend not available')) {
        console.info('Using mock files in demo mode');
        const mockTree: FileNode[] = [
            {
                name: 'src',
                path: 'src',
                type: 'folder',
                children: [
                    {
                        name: 'components',
                        path: 'src/components',
                        type: 'folder',
                        children: [
                             { name: 'UserService.ts', path: 'src/components/UserService.ts', type: 'file', size: 1024 },
                             { name: 'LoginForm.tsx', path: 'src/components/LoginForm.tsx', type: 'file', size: 2048 }
                        ]
                    },
                    {
                        name: 'utils',
                        path: 'src/utils',
                        type: 'folder',
                        children: [
                            { name: 'helpers.js', path: 'src/utils/helpers.js', type: 'file', size: 512 }
                        ]
                    }
                ]
            }
        ];
        setFiles(mockTree);
        setSelectedRepo(repo);
        setSelectedFiles([]);
        setFilesRetryCount(0);
        handleSuccess(`Demo files loaded for ${repo.name}`);
      } else if (!isRetry) {
        handleError(apiError, () => loadFiles(repo, branch, true));
      } else {
          // If retry failed, reset selected repo
          setSelectedRepo(null);
      }
    } finally {
      setIsLoadingFiles(false);
    }
  }, [handleError, handleSuccess, selectedBranch]);

  const generateSummaries = useCallback(async (isRetry = false) => {
    if (selectedFiles.length === 0 || !selectedRepo) return;
    
    setIsGeneratingSummaries(true);
    setSummariesError(null);
    
    if (isRetry) {
      setSummariesRetryCount(prev => prev + 1);
    }
    
    try {
      // Find file nodes from paths
      const selectedFileObjects = selectedFiles
        .map(path => findFileInTree(files, path))
        .filter((f): f is FileNode => f !== null);
      
      // Call backend to generate summaries
      const summariesData = await api.post<{ summaries: BackendTestSummary[]; failedFiles?: { path: string; error: string }[]; message?: string }>(
        '/v1/testcases/generate/summaries',
        {
          files: selectedFileObjects.map(f => ({
            path: f.path,
            language: getLanguageFromPath(f.path)
          })),
          repo: {
            owner: selectedRepo.owner.login,
            repo: selectedRepo.name
          }
        }
      );
      
      // Normalize backend summaries to frontend TestSummary shape
      const normalizedSummaries: TestSummary[] = (summariesData.summaries || []).map((s: BackendTestSummary) => {
        const filePath = s.filePath || s.path || s.file || '';
        const fileName = s.fileName || (filePath ? filePath.split('/').pop() : '') || 'unknown';
        const estimated = typeof s.estimatedTests === 'number' ? s.estimatedTests : 1;
        const complexity = s.complexity || (estimated >= 15 ? 'high' : estimated >= 8 ? 'medium' : 'low');
        return {
          id: filePath || fileName,
          fileName,
          filePath,
          language: s.language || 'Unknown',
          summary: s.summary || s.brief || '',
          testTypes: s.testTypes || (s.keyFunctions && s.keyFunctions.length > 0 ? ['Unit Tests', 'Integration Tests'] : ['Unit Tests']),
          complexity,
          estimatedTests: estimated
        };
      });

      setTestSummaries(normalizedSummaries);
      setSummariesRetryCount(0);
      
      // Handle failed files
      if (summariesData.failedFiles && summariesData.failedFiles.length > 0) {
        setFailedFiles(summariesData.failedFiles);
        const binaryFailures = summariesData.failedFiles.filter(f => f.error.includes('Binary file'));
        
        if (binaryFailures.length > 0) {
          handleWarning(
            `Skipped ${binaryFailures.length} binary files`, 
            "Binary files cannot be analyzed. Please select source code files."
          );
        }
        
        if (summariesData.failedFiles.length > binaryFailures.length) {
          const otherFailures = summariesData.failedFiles.length - binaryFailures.length;
          handleWarning(
            `Failed to process ${otherFailures} files`, 
            "Some files could not be analyzed. Check console for details."
          );
        }
      } else {
        setFailedFiles([]);
      }
      
      handleSuccess(`Generated ${normalizedSummaries.length} test summaries`);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to generate summaries:', apiError);
      setSummariesError(apiError.message || 'Failed to generate summaries');
      setFailedFiles([]);
      
      // Fallback to mock summaries for now
      const selectedFileObjects = selectedFiles
          .map(path => findFileInTree(files, path))
          .filter((f): f is FileNode => f !== null);
          
      const summaries = selectedFileObjects.map(f => generateMockSummary({ name: f.name, path: f.path }));
      setTestSummaries(summaries);
      
      if (!isRetry) {
        handleError(apiError, () => generateSummaries(true));
      }
    } finally {
      setIsGeneratingSummaries(false);
    }
  }, [files, selectedFiles, selectedRepo, handleError, handleSuccess, handleWarning]);

  const generateTestCode = useCallback(async (summary: TestSummary, mode: 'test' | 'explain' = 'test', isRetry = false) => {
    setIsGeneratingCode(true);
    setCodeError(null);
    
    if (isRetry) {
      setCodeRetryCount(prev => prev + 1);
    }
    
    try {
      // Find relevant file node
      const fileNode = findFileInTree(files, summary.filePath);
      
      // Call backend to generate test code
      const codeData = await api.post<{ code: string; language: string }>('/v1/testcases/generate/code', {
        summaryId: summary.filePath || summary.id,
        files: fileNode ? [{
          path: fileNode.path,
          language: getLanguageFromPath(fileNode.path)
        }] : [],
        framework: 'jest', // Default framework
        repo: selectedRepo ? { owner: selectedRepo.owner.login, repo: selectedRepo.name } : undefined,
        mode
      });
      
      setGeneratedCode({
        summary,
        code: codeData.code,
        language: codeData.language
      });
      setCodeRetryCount(0);
      handleSuccess(mode === 'explain' ? 'Code explanation generated successfully' : 'Test code generated successfully');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to generate test code:', apiError);
      setCodeError(apiError.message || 'Failed to generate test code');
      
      // Fallback to mock code for now
      const code = generateMockTestCode(summary);
      const language = summary.language.toLowerCase() === 'react' ? 'javascript' : summary.language.toLowerCase();
      
      setGeneratedCode({
        summary,
        code,
        language
      });
      
      if (!isRetry) {
        handleError(apiError, () => generateTestCode(summary, mode, true));
      }
    } finally {
      setIsGeneratingCode(false);
    }
  }, [files, selectedRepo, handleError, handleSuccess]);

  const resetGeneration = useCallback(() => {
    setTestSummaries([]);
    setGeneratedCode(null);
  }, []);

  const resetRepositorySelection = useCallback(() => {
    setSelectedRepo(null);
    setFiles([]);
    setSelectedFiles([]);
    setTestSummaries([]);
    setGeneratedCode(null);
    setFilesError(null);
  }, []);

  // Create pull request with generated tests
  const createPullRequest = useCallback(async (testCode: string, branchName: string = 'feature/add-tests', isRetry = false) => {
    if (!selectedRepo) throw new Error('No repository selected');
    
    setIsCreatingPR(true);
    setPrError(null);
    
    if (isRetry) {
      setPrRetryCount(prev => prev + 1);
    }
    
    try {
      const prData = await api.post<{ url: string; number: number }>(`/v1/github/repos/${selectedRepo.owner.login}/${selectedRepo.name}/pr`, {
        branchName,
        title: 'Add AI-generated test cases',
        body: 'This PR adds comprehensive test cases generated by our AI testing assistant.',
        files: [{
          path: `tests/${selectedFiles[0]?.split('/').pop()?.replace('.', '.test.') || 'test.js'}`,
          content: testCode
        }],
        baseBranch: 'main'
      });
      
      setPrRetryCount(0);
      handleSuccess(`Pull Request #${prData.number} created successfully!`);
      return prData;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to create pull request:', apiError);
      setPrError(apiError.message || 'Failed to create pull request');
      
      if (!isRetry) {
        handleError(apiError, () => createPullRequest(testCode, branchName, true));
      }
      
      throw apiError;
    } finally {
      setIsCreatingPR(false);
    }
  }, [selectedRepo, selectedFiles, handleError, handleSuccess]);

  const toggleShowIgnored = useCallback(() => {
    const newValue = !showIgnored;
    setShowIgnored(newValue);
    if (selectedRepo) {
      loadFiles(selectedRepo, selectedBranch, false, newValue);
    }
  }, [showIgnored, selectedRepo, selectedBranch, loadFiles]);

  return {
    // Data
    showIgnored,
    repos,
    selectedRepo,
    branches,
    selectedBranch,
    files,
    selectedFiles,
    testSummaries,
    generatedCode,
    failedFiles,
    
    // Loading states
    isLoadingRepos,
    isLoadingBranches,
    isLoadingFiles,
    isGeneratingSummaries,
    isGeneratingCode,
    isCreatingPR,
    
    // Error states
    reposError,
    branchesError,
    filesError,
    summariesError,
    codeError,
    prError,
    
    // Retry counts
    reposRetryCount,
    filesRetryCount,
    summariesRetryCount,
    codeRetryCount,
    prRetryCount,
    
    // Actions
    toggleFileSelection,
    selectAllFiles,
    clearAllFiles,
    loadRepos,
    loadBranches,
    loadFiles,
    generateSummaries,
    generateTestCode,
    resetGeneration,
    resetRepositorySelection,
    createPullRequest,
    toggleShowIgnored,
    setSelectedFiles, // Exposed so FileTree can update selection directly
    setSelectedBranch
  };
};
