import { jest } from '@jest/globals';
import path from 'path';

// Hoist mocks
jest.unstable_mockModule('child_process', () => ({
  exec: jest.fn(),
}));

jest.unstable_mockModule('fs/promises', () => ({
  writeFile: jest.fn(() => Promise.resolve()),
  rm: jest.fn(() => Promise.resolve()),
  mkdir: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve('')),
}));

// Import mocks to configure them in tests
const { exec } = await import('child_process');
const { writeFile, rm, mkdir, readFile } = await import('fs/promises');

// Import module under test
const { runTests } = await import('../../src/services/testRunner.service.js');

describe('testRunnerService - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure path.join works as expected for mocks
    jest.spyOn(path, 'join').mockImplementation((...args) => args.join('/'));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should successfully run Jest tests and parse output', async () => {
    const mockTestCode = `describe('test', () => { it('should pass', () => { expect(true).toBe(true); }); });`;
    const mockSourceCode = `function add(a, b) { return a + b; }`;
    const mockJestJsonOutput = JSON.stringify({
      "numTotalTestSuites": 1,
      "numPassedTestSuites": 1,
      "numFailedTestSuites": 0,
      "numTotalTests": 1,
      "numPassedTests": 1,
      "numFailedTests": 0,
      "numPendingTests": 0,
      "success": true,
      "testResults": [
        {
          "testFilePath": "/test-sandboxes/mock-uuid/test.test.js",
          "testResults": [
            {
              "ancestorTitles": ["test"],
              "status": "passed",
              "title": "should pass",
              "failureMessages": [],
            },
          ],
          "status": "passed",
        },
      ],
    });

    exec.mockImplementation((command, options, callback) => {
      callback(null, 'stdout', '');
    });

    // Mock readFile to return the Jest JSON output when the parser tries to read it
    readFile.mockImplementation((path) => {
      if (path && path.includes('test-results.json')) {
        return Promise.resolve(mockJestJsonOutput);
      }
      return Promise.resolve('');
    });

    const result = await runTests({
      testCode: mockTestCode,
      sourceCode: mockSourceCode,
      language: 'javascript',
      framework: 'jest',
    });

    expect(exec).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledTimes(2); // test.test.js and source.js
    expect(rm).toHaveBeenCalledTimes(1); // Cleanup

    expect(result.success).toBe(true);
    expect(result.summary.total).toBe(1);
    expect(result.summary.passed).toBe(1);
    expect(result.summary.failed).toBe(0);
    expect(result.summary.passRate).toBe(100);
    expect(result.results.length).toBe(1);
    expect(result.results[0].suites[0].tests[0].name).toBe("should pass");
    expect(result.results[0].suites[0].tests[0].status).toBe("passed");
  });

  it('should handle failed Jest tests and parse output', async () => {
    const mockTestCode = `describe('test', () => { it('should fail', () => { expect(true).toBe(false); }); });`;
    const mockSourceCode = `function add(a, b) { return a + b; }`;
    const mockJestJsonOutput = JSON.stringify({
      "numTotalTestSuites": 1,
      "numPassedTestSuites": 0,
      "numFailedTestSuites": 1,
      "numTotalTests": 1,
      "numPassedTests": 0,
      "numFailedTests": 1,
      "numPendingTests": 0,
      "success": false,
      "testResults": [
        {
          "testFilePath": "/test-sandboxes/mock-uuid/test.test.js",
          "testResults": [
            {
              "ancestorTitles": ["test"],
              "status": "failed",
              "title": "should fail",
              "failureMessages": ["Expected: false Received: true"],
            },
          ],
          "status": "failed",
        },
      ],
    });

    exec.mockImplementation((command, options, callback) => {
      callback(null, 'stdout', '');
    });

    readFile.mockImplementation((path) => {
      if (path && path.includes('test-results.json')) {
        return Promise.resolve(mockJestJsonOutput);
      }
      return Promise.resolve('');
    });

    const result = await runTests({
      testCode: mockTestCode,
      sourceCode: mockSourceCode,
      language: 'javascript',
      framework: 'jest',
    });

    expect(exec).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledTimes(2);
    expect(rm).toHaveBeenCalledTimes(1);

    expect(result.success).toBe(true); // runTests itself didn't error, the test inside failed
    expect(result.summary.total).toBe(1);
    expect(result.summary.passed).toBe(0);
    expect(result.summary.failed).toBe(1);
    expect(result.summary.passRate).toBe(0);
    expect(result.results.length).toBe(1);
    expect(result.results[0].suites[0].tests[0].name).toBe("should fail");
    expect(result.results[0].suites[0].tests[0].status).toBe("failed");
    expect(result.results[0].suites[0].tests[0].message).toContain("Expected: false");
  });
});
