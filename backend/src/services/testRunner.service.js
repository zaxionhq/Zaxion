// src/services/testRunner.service.js
import { exec } from "child_process";
import { writeFile, rm, mkdir, readFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { parseStringPromise } from 'xml2js'; // Import xml2js
import { testRunnerExecutionCounter } from "../utils/metrics.js";
import * as logger from "../utils/logger.js";

const SANDBOX_DIR = path.resolve(process.cwd(), "./test-sandboxes");

/**
 * Validates that a path is within the allowed sandbox directory.
 * @param {string} p - The path to validate
 * @returns {string} - The resolved path
 */
function validateSandboxPath(p) {
  const resolved = path.resolve(p);
  if (!resolved.startsWith(SANDBOX_DIR)) {
    throw new Error(`Security violation: Path ${p} is outside sandbox directory`);
  }
  return resolved;
}

async function createSandbox(testCode, sourceCode, language, framework) {
  const sandboxId = uuidv4();
  const sandboxPath = validateSandboxPath(path.join(SANDBOX_DIR, sandboxId));
  await mkdir(sandboxPath, { recursive: true });

  let testFilePath;
  let sourceFilePath;

  // Determine file names based on language/framework
  if (language === "javascript" && framework === "jest") {
    testFilePath = path.join(sandboxPath, "test.test.js");
    sourceFilePath = path.join(sandboxPath, "source.js");
  } else if (language === "python" && framework === "pytest") {
    testFilePath = path.join(sandboxPath, "test_file.py");
    sourceFilePath = path.join(sandboxPath, "source.py");
  } else if (language === "java" && framework === "junit") {
    // For Java, we need a more complex setup with class names matching file names
    // This is a simplification; a full solution would parse class names.
    testFilePath = path.join(sandboxPath, "MyTest.java");
    sourceFilePath = path.join(sandboxPath, "MySource.java");
  } else if (language === "csharp" && framework === "nunit") {
    testFilePath = path.join(sandboxPath, "MyTests.cs");
    sourceFilePath = path.join(sandboxPath, "MySource.cs");
  } else if (language === "go" && framework === "go_testing") {
    testFilePath = path.join(sandboxPath, "source_test.go");
    sourceFilePath = path.join(sandboxPath, "source.go");
  } else if (language === "ruby" && framework === "rspec") {
    testFilePath = path.join(sandboxPath, "source_spec.rb");
    sourceFilePath = path.join(sandboxPath, "source.rb");
  } else {
    throw new Error(`Unsupported language/framework for test execution: ${language}/${framework}`);
  }

  // Validate all constructed paths
  validateSandboxPath(testFilePath);
  validateSandboxPath(sourceFilePath);

  await Promise.all([
    writeFile(testFilePath, testCode),
    writeFile(sourceFilePath, sourceCode),
  ]);

  return { sandboxPath, testFilePath, sourceFilePath, sandboxId };
}

async function executeCommand(command, cwd) {
  validateSandboxPath(cwd);
  return new Promise((resolve, reject) => {
    exec(command, { cwd, timeout: 60000 }, (error, stdout, stderr) => { // 60s timeout per run
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

export function parseJestOutput(output) {
  try {
    const json = JSON.parse(output);
    return {
      totalTests: json.numTotalTests,
      passedTests: json.numPassedTests,
      failedTests: json.numFailedTests,
      skippedTests: json.numPendingTests,
      testResults: json.testResults.map(tr => {
        const suitesMap = new Map();
        
        tr.testResults.forEach(test => {
          const suiteName = test.ancestorTitles.join(' > ') || 'Root';
          if (!suitesMap.has(suiteName)) {
            suitesMap.set(suiteName, {
              name: suiteName,
              status: 'passed',
              tests: []
            });
          }
          const suite = suitesMap.get(suiteName);
          suite.tests.push({
            name: test.title,
            status: test.status,
            message: test.failureMessages.join("\n") || ""
          });
          if (test.status === 'failed') suite.status = 'failed';
        });

        return {
          name: tr.testFilePath.split('/').pop(),
          status: tr.status,
          message: tr.message || "",
          suites: Array.from(suitesMap.values())
        };
      }),
      raw: output,
    };
  } catch (e) {
    logger.error("Error parsing Jest output:", e);
    return { success: false, message: "Failed to parse Jest output.", raw: output };
  }
}

export async function parsePytestOutput(outputFilePath) {
  try {
    const xml = await readFile(validateSandboxPath(outputFilePath), "utf8");
    const result = await parseStringPromise(xml);

    const testsuite = result.testsuites.testsuite[0]; // Assuming one testsuite
    const testcases = testsuite.testcase || [];

    let passedTests = 0;
    let failedTests = 0;
    const testResults = [];

    for (const tc of testcases) {
      const name = tc.$.name;
      const className = tc.$.classname;
      const status = tc.failure ? "failed" : "passed";
      const message = tc.failure ? tc.failure[0].$.message : "";

      if (status === "passed") passedTests++;
      else failedTests++;

      testResults.push({
        name: `${className}.${name}`,
        status,
        message,
      });
    }

    return {
      totalTests: parseInt(testsuite.$.tests, 10),
      passedTests,
      failedTests,
      skippedTests: parseInt(testsuite.$.skipped, 10) || 0,
      testResults,
      raw: xml,
    };
  } catch (e) {
    logger.error("Error parsing Pytest (JUnit XML) output:", e);
    return { success: false, message: "Failed to parse Pytest output.", raw: "" };
  }
}

export async function parseJUnitOutput(outputFilePath) {
  try {
    const xml = await readFile(validateSandboxPath(outputFilePath), "utf8");
    const result = await parseStringPromise(xml);

    const testsuite = result.testsuites.testsuite[0]; // Assuming one testsuite
    const testcases = testsuite.testcase || [];

    let passedTests = 0;
    let failedTests = 0;
    const testResults = [];

    for (const tc of testcases) {
      const name = tc.$.name;
      const className = tc.$.classname;
      const status = tc.failure ? "failed" : "passed";
      const message = tc.failure ? tc.failure[0].$.message : "";

      if (status === "passed") passedTests++;
      else failedTests++;

      testResults.push({
        name: `${className}.${name}`,
        status,
        message,
      });
    }

    return {
      totalTests: parseInt(testsuite.$.tests, 10),
      passedTests,
      failedTests,
      skippedTests: parseInt(testsuite.$.skipped, 10) || 0,
      testResults,
      raw: xml,
    };
  } catch (e) {
    logger.error("Error parsing JUnit XML output:", e);
    return { success: false, message: "Failed to parse JUnit XML output.", raw: "" };
  }
}

export async function parseNUnitOutput(outputFilePath) {
  try {
    const xml = await readFile(validateSandboxPath(outputFilePath), "utf8");
    const result = await parseStringPromise(xml);

    const testsuite = result['test-run'].testsuite[0]; // NUnit XML structure might differ slightly
    const testcases = testsuite.testcase || [];

    let passedTests = 0;
    let failedTests = 0;
    const testResults = [];

    for (const tc of testcases) {
      const name = tc.$.name;
      const className = tc.$.classname || tc.$.fullname; // NUnit might use fullname
      const status = tc.$.result === "Passed" ? "passed" : "failed"; // NUnit uses "Passed" or "Failed"
      const message = tc.failure ? tc.failure[0].message[0] : ""; // NUnit failure message structure

      if (status === "passed") passedTests++;
      else failedTests++;

      testResults.push({
        name: `${className}.${name}`,
        status,
        message,
      });
    }

    return {
      totalTests: parseInt(testsuite.$.total, 10),
      passedTests: parseInt(testsuite.$.passed, 10),
      failedTests: parseInt(testsuite.$.failed, 10),
      skippedTests: parseInt(testsuite.$.skipped, 10) || 0,
      testResults,
      raw: xml,
    };
  } catch (e) {
    logger.error("Error parsing NUnit XML output:", e);
    return { success: false, message: "Failed to parse NUnit XML output.", raw: "" };
  }
}

export async function parseGoTestingOutput(output) {
  try {
    // Go test -json output is a stream of JSON objects, not a single array.
    // We need to parse each line as a JSON object.
    const lines = output.split('\n').filter(line => line.trim() !== '');
    const events = lines.map(line => JSON.parse(line));

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    const testResults = [];
    const testStatusMap = new Map(); // To track status of each test by its Name

    for (const event of events) {
      if (event.Action === "run" && event.Test) {
        totalTests++;
      } else if (event.Action === "pass" && event.Test) {
        passedTests++;
        testStatusMap.set(event.Test, "passed");
      } else if (event.Action === "fail" && event.Test) {
        failedTests++;
        testStatusMap.set(event.Test, "failed");
      } else if (event.Action === "skip" && event.Test) {
        skippedTests++;
        testStatusMap.set(event.Test, "skipped");
      }

      // Capture output for failed tests for message
      if (event.Action === "output" && event.Test && testStatusMap.get(event.Test) === "failed") {
        const existingResult = testResults.find(tr => tr.name === event.Test);
        if (existingResult) {
          existingResult.message += event.Output;
        } else {
          testResults.push({ name: event.Test, status: "failed", message: event.Output });
        }
      }
    }

    // Populate final test results based on status map
    testStatusMap.forEach((status, name) => {
      const existing = testResults.find(tr => tr.name === name);
      if (!existing) {
        testResults.push({ name, status, message: "" });
      } else {
        existing.status = status;
      }
    });

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      testResults,
      raw: output,
    };
  } catch (e) {
    logger.error("Error parsing Go testing output:", e);
    return { success: false, message: "Failed to parse Go testing output.", raw: output };
  }
}

export async function parseRSpecOutput(output) {
  try {
    const json = JSON.parse(output);
    return {
      totalTests: json.summary.example_count,
      passedTests: json.summary.example_count - json.summary.failure_count - json.summary.pending_count,
      failedTests: json.summary.failure_count,
      skippedTests: json.summary.pending_count,
      testResults: json.examples.map(ex => ({
        name: ex.full_description,
        status: ex.status === "passed" ? "passed" : (ex.status === "pending" ? "skipped" : "failed"),
        message: ex.exception ? `${ex.exception.class}: ${ex.exception.message}` : ""
      })),
      raw: output,
    };
  } catch (e) {
    logger.error("Error parsing RSpec JSON output:", e);
    return { success: false, message: "Failed to parse RSpec output.", raw: output };
  }
}

export async function runTests({ testCode, sourceCode, language, framework }) {
  let sandbox;
  let status = 'success';
  try {
    const startTime = Date.now();
    sandbox = await createSandbox(testCode, sourceCode, language, framework);
    const { sandboxPath } = sandbox;

    let command;
    let testOutputFilePath = path.join(sandboxPath, "test-results.json"); // Default for Jest

    if (language === "javascript" && framework === "jest") {
      // Ensure Jest is installed locally in the sandbox for consistent execution
      // Configure Jest to output JSON results to a file
      command = `npm init -y --prefix ${sandboxPath} && npm install --prefix ${sandboxPath} jest && ${path.join(sandboxPath, "node_modules", ".bin", "jest")} --json --outputFile=${testOutputFilePath} ${sandbox.testFilePath}`;
    } else if (language === "python" && framework === "pytest") {
      // Configure Pytest to output JUnit XML results
      testOutputFilePath = path.join(sandboxPath, "test-results.xml");
      command = `pip install pytest && pytest --junitxml=${testOutputFilePath} ${sandbox.testFilePath}`;
    } else if (language === "java" && framework === "junit") {
      // This is a placeholder. Full Java/JUnit execution requires Maven/Gradle setup.
      // We'll simulate JUnit XML output here. For a real app, you'd use `mvn test` or `gradle test`.
      testOutputFilePath = path.join(sandboxPath, "test-results.xml");
      command = `javac ${sandbox.sourceFilePath} ${sandbox.testFilePath} && java -cp ${sandboxPath} org.junit.runner.JUnitCore MyTest > ${testOutputFilePath}`;
    } else if (language === "csharp" && framework === "nunit") {
      // Placeholder for C#/NUnit. Requires dotnet SDK and NUnit console runner.
      // Assuming NUnit console runner can output XML
      testOutputFilePath = path.join(sandboxPath, "test-results.xml");
      command = `dotnet new console -o ${sandboxPath} && cp ${sandbox.sourceFilePath} ${sandboxPath}/MySource.cs && cp ${sandbox.testFilePath} ${sandboxPath}/MyTests.cs && cd ${sandboxPath} && dotnet add package NUnit && dotnet add package NUnit3TestAdapter && dotnet test --logger "junit;LogFilePath=${testOutputFilePath}"`;
    } else if (language === "go" && framework === "go_testing") {
      // Go's built-in testing package can output JSON
      command = `cd ${sandboxPath} && go test -json ${sandbox.testFilePath}`;
    } else if (language === "ruby" && framework === "rspec") {
      // Configure RSpec to output JSON results
      testOutputFilePath = path.join(sandboxPath, "test-results.json");
      command = `bundle install --gemfile=${sandboxPath}/Gemfile && rspec --format json --out ${testOutputFilePath} ${sandbox.testFilePath}`;
    } else {
      throw new Error(`Unsupported language/framework for test execution: ${language}/${framework}`);
    }

    const { stdout, stderr } = await executeCommand(command, sandboxPath);

    let parsedResults = {};
    if (language === "javascript" && framework === "jest") {
      try {
        const jestOutput = await readFile(validateSandboxPath(testOutputFilePath), "utf8");
        parsedResults = parseJestOutput(jestOutput);
      } catch (e) {
        logger.error("Error reading Jest output file:", e);
        parsedResults = { success: false, message: "Failed to read Jest output file.", raw: stdout };
      }
    } else if (language === "python" && framework === "pytest") {
      try {
        parsedResults = await parsePytestOutput(validateSandboxPath(testOutputFilePath));
      } catch (e) {
        logger.error("Error parsing Pytest output:", e);
        parsedResults = { success: false, message: "Failed to parse Pytest output.", raw: stdout };
      }
    } else if (language === "java" && framework === "junit") {
      try {
        parsedResults = await parseJUnitOutput(validateSandboxPath(testOutputFilePath));
      } catch (e) {
        logger.error("Error parsing JUnit output:", e);
        parsedResults = { success: false, message: "Failed to parse JUnit output.", raw: stdout };
      }
    } else if (language === "csharp" && framework === "nunit") {
      try {
        parsedResults = await parseNUnitOutput(validateSandboxPath(testOutputFilePath));
      } catch (e) {
        logger.error("Error parsing NUnit output:", e);
        parsedResults = { success: false, message: "Failed to parse NUnit output.", raw: stdout };
      }
    } else if (language === "go" && framework === "go_testing") {
      try {
        // Go outputs JSON to stdout directly, no file needed unless redirected
        parsedResults = await parseGoTestingOutput(stdout);
      } catch (e) {
        logger.error("Error parsing Go testing output:", e);
        parsedResults = { success: false, message: "Failed to parse Go testing output.", raw: stdout };
      }
    } else if (language === "ruby" && framework === "rspec") {
      try {
        const rspecOutput = await readFile(validateSandboxPath(testOutputFilePath), "utf8");
        parsedResults = await parseRSpecOutput(rspecOutput);
      } catch (e) {
        logger.error("Error parsing RSpec output:", e);
        parsedResults = { success: false, message: "Failed to parse RSpec output.", raw: stdout };
      }
    } else {
      // Fallback for other languages if parsing is not yet implemented
      parsedResults = {
        success: !stderr,
        message: stderr || stdout,
        raw: stdout + stderr,
      };
    }

    const durationMs = Date.now() - startTime;

    // Standardized result envelope
    const standardResult = {
      success: !stderr,
      language,
      framework,
      durationMs,
      summary: {
        total: parsedResults.totalTests ?? 0,
        passed: parsedResults.passedTests ?? 0,
        failed: parsedResults.failedTests ?? 0,
        skipped: parsedResults.skippedTests ?? 0,
        passRate: (() => {
          const total = parsedResults.totalTests ?? 0;
          if (!total) return 0;
          return Math.round(((parsedResults.passedTests ?? 0) / total) * 100);
        })(),
      },
      results: parsedResults.testResults ?? [],
      artifacts: {
        raw: parsedResults.raw ?? (stdout + (stderr || "")),
      },
      stderr: stderr || "",
      stdout: stdout || "",
    };

    return standardResult;
  } catch (error) {
    status = 'failure';
    return {
      success: false,
      stdout: error.stdout || "",
      stderr: error.stderr || error.message,
      language,
      framework,
      durationMs: 0,
      summary: { total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      results: [],
      artifacts: { raw: (error.stdout || "") + (error.stderr || error.message || "") },
    };
  } finally {
    testRunnerExecutionCounter.inc({ language, status });
    if (sandbox && sandbox.sandboxPath) {
      // Clean up sandbox directory after run
      try { 
        await rm(sandbox.sandboxPath, { recursive: true, force: true }); 
      } catch (_e) {
        // Ignore cleanup errors
      }
    }
  }
}