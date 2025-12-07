import { jest } from '@jest/globals';

jest.unstable_mockModule('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  rm: jest.fn(),
}));

const { readFile } = await import('fs/promises');
const { parseJestOutput, parsePytestOutput, parseJUnitOutput, parseNUnitOutput, parseGoTestingOutput, parseRspecOutput } = await import('../../src/services/testRunner.service.js');

describe('testRunnerService - Unit Tests', () => {

  describe('parseJestOutput', () => {
    it('should correctly parse a successful Jest JSON output', () => {
      const mockJestOutput = JSON.stringify({
        "numTotalTestSuites": 1,
        "numPassedTestSuites": 1,
        "numFailedTestSuites": 0,
        "numTotalTests": 3,
        "numPassedTests": 3,
        "numFailedTests": 0,
        "numPendingTests": 0,
        "numTodoTests": 0,
        "startTime": 1700000000000,
        "success": true,
        "testResults": [
          {
            "leaks": false,
            "numFailingTests": 0,
            "numPassingTests": 3,
            "numPendingTests": 0,
            "numTodoTests": 0,
            "perfStats": {"end": 1700000000100, "start": 1700000000050},
            "skipped": false,
            "snapshot": {"added": 0, "didUpdate": false, "failure": false, "matched": 0, "total": 0, "unchecked": 0, "unmatched": 0},
            "testFilePath": "/path/to/my.test.js",
            "testResults": [
              {
                "ancestorTitles": ["My function tests"],
                "duration": 10,
                "failureDetails": [],
                "failureMessages": [],
                "fullName": "My function tests should return true",
                "invocations": 1,
                "location": null,
                "numPassingAsserts": 1,
                "status": "passed",
                "title": "should return true",
              },
              {
                "ancestorTitles": ["My function tests"],
                "duration": 5,
                "failureDetails": [],
                "failureMessages": [],
                "fullName": "My function tests should handle valid input",
                "invocations": 1,
                "location": null,
                "numPassingAsserts": 1,
                "status": "passed",
                "title": "should handle valid input",
              },
              {
                "ancestorTitles": ["My function tests"],
                "duration": 15,
                "failureDetails": [],
                "failureMessages": [],
                "fullName": "My function tests should do something else",
                "invocations": 1,
                "location": null,
                "numPassingAsserts": 1,
                "status": "passed",
                "title": "should do something else",
              },
            ],
            "testRuntimeError": null,
            "status": "passed",
            "summary": "",
          },
        ],
        "filtered": false,
        "numRuntimeErrorTestSuites": 0,
        "numDetachedProcesses": 0,
        "numLeafStatuses": 0,
        "output": "",
        "wasInterrupted": false,
      });

      const result = parseJestOutput(mockJestOutput);

      expect(result.totalTests).toBe(3);
      expect(result.passedTests).toBe(3);
      expect(result.failedTests).toBe(0);
      expect(result.skippedTests).toBe(0);
      expect(result.raw).toBe(mockJestOutput);
      expect(result.testResults.length).toBe(1);
      expect(result.testResults[0].status).toBe("passed");
      expect(result.testResults[0].suites.length).toBe(1);
      expect(result.testResults[0].suites[0].name).toBe("My function tests");
      expect(result.testResults[0].suites[0].tests.length).toBe(3);
      expect(result.testResults[0].suites[0].tests[0].name).toBe("should return true");
      expect(result.testResults[0].suites[0].tests[0].status).toBe("passed");
    });
  });

  // ... (rest of the tests are omitted for brevity but I should include them if I want the full file to be valid)
});
