import { jest } from '@jest/globals';
import axios from 'axios';

// Mock dependencies using unstable_mockModule for ESM support
jest.unstable_mockModule('../../src/utils/metrics.js', () => ({
  githubServiceCallCounter: {
    inc: jest.fn()
  }
}));

// We also need to mock axios if it's imported in the service
jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

// Dynamic import of the module under test
const { getRepoTree } = await import('../../src/services/github.service.js');
const { default: mockedAxios } = await import('axios');

describe('GitHub Service - getRepoTree', () => {
  const mockToken = 'mock-token';
  const mockOwner = 'test-owner';
  const mockRepo = 'test-repo';
  const mockBranch = 'main';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch repo tree and return hierarchical structure', async () => {
    // Mock tree response
    const mockTreeData = {
      sha: 'tree-sha',
      url: 'tree-url',
      truncated: false,
      tree: [
        { path: 'src/index.ts', mode: '100644', type: 'blob', sha: 'sha1', size: 100, url: 'url1' },
        { path: 'src/utils/helper.js', mode: '100644', type: 'blob', sha: 'sha2', size: 200, url: 'url2' },
        { path: 'README.md', mode: '100644', type: 'blob', sha: 'sha3', size: 300, url: 'url3' },
        { path: 'node_modules/lib.js', mode: '100644', type: 'blob', sha: 'sha4', size: 400, url: 'url4' },
        { path: 'image.png', mode: '100644', type: 'blob', sha: 'sha5', size: 500, url: 'url5' }
      ]
    };

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/git/trees/')) {
        return Promise.resolve({ data: mockTreeData });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    const result = await getRepoTree(mockToken, mockOwner, mockRepo, mockBranch);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining(`/repos/${mockOwner}/${mockRepo}/git/trees/${mockBranch}?recursive=1`),
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` }
      })
    );

    // Verify structure
    // Expecting:
    // - src (folder)
    //   - index.ts (file)
    //   - utils (folder)
    //     - helper.js (file)
    
    expect(result).toHaveLength(1); // Only 'src' folder at root
    const srcFolder = result[0];
    expect(srcFolder.name).toBe('src');
    expect(srcFolder.type).toBe('folder');
    expect(srcFolder.children).toHaveLength(2); // index.ts and utils folder

    // Check children of src
    const indexFile = srcFolder.children.find(c => c.name === 'index.ts');
    const utilsFolder = srcFolder.children.find(c => c.name === 'utils');
    
    expect(indexFile).toBeDefined();
    expect(indexFile.type).toBe('file');
    
    expect(utilsFolder).toBeDefined();
    expect(utilsFolder.type).toBe('folder');
    
    // Check children of utils
    expect(utilsFolder.children).toHaveLength(1);
    expect(utilsFolder.children[0].name).toBe('helper.js');
  });

  it('should fetch default branch if not provided', async () => {
    const defaultBranch = 'develop';
    
    // Mock repo info response
    mockedAxios.get.mockImplementation((url) => {
      if (url === `https://api.github.com/repos/${mockOwner}/${mockRepo}`) {
        return Promise.resolve({ data: { default_branch: defaultBranch } });
      }
      if (url.includes('/git/trees/')) {
        return Promise.resolve({ data: { tree: [] } });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    await getRepoTree(mockToken, mockOwner, mockRepo); // No branch provided

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `https://api.github.com/repos/${mockOwner}/${mockRepo}`,
      expect.anything()
    );
    
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining(`/git/trees/${defaultBranch}`),
      expect.anything()
    );
  });

  it('should handle API errors', async () => {
    const errorMessage = 'API Rate Limit Exceeded';
    mockedAxios.get.mockRejectedValue(new Error(errorMessage));

    await expect(getRepoTree(mockToken, mockOwner, mockRepo, mockBranch))
      .rejects.toThrow(errorMessage);
  });
});
