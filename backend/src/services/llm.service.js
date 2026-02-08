// src/services/gemini.service.js
/**
 * Gemini / LLM service wrapper
 *
 * - Exports generateSummaries({ files, repo, user })
 *   and generateTestCode({ file, summary, repo, user, framework })
 *
 * - Uses environment variable GEMINI_API_KEY (or other provider key) and GEMINI_API_URL (provider endpoint).
 * - If provider creds are not present, falls back to mockai.service.generateMockTests to maintain dev flow.
 *
 * File shape expected:
 * files: [
 *   { path: "src/foo.js", name: "foo.js", language: "javascript", content: "..." }
 * ]
 *
 * IMPORTANT: LLM providers differ. This module uses a generic JSON POST to GEMINI_API_URL with { input: prompt }.
 * Adapt sendToProvider() to match your chosen provider's API (OpenAI, Gemini, OpenRouter, etc.)
 */

// Removed axios import
import { chunk } from "lodash-es";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import axios from "axios"; // Import axios for OpenRouter/OpenAI
import { escapeForLLM, sanitizeCodeString } from "../utils/sanitization.utils.js";
import * as logger from "../utils/logger.js";

const LLM_PROVIDER = process.env.LLM_PROVIDER || "gemini"; // 'gemini', 'openai', 'openrouter'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free"; // Default to a free model on OpenRouter

const DEFAULT_MAX_CHARS = parseInt(process.env.LLM_MAX_CHARS || "24000", 10);

let genAI = null;
let geminiModel = null;

if (LLM_PROVIDER === "gemini" && GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });
}

// Removed API_URL as we are using the SDK directly
// const DEFAULT_MAX_CHARS = parseInt(process.env.LLM_MAX_CHARS || "24000", 10); // conservative per-request char limit

// Initialize Gemini
// const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
// const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings: [
//   {
//     category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//     threshold: HarmBlockThreshold.BLOCK_NONE,
//   },
//   {
//     category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//     threshold: HarmBlockThreshold.BLOCK_NONE,
//   },
//   {
//     category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
//     threshold: HarmBlockThreshold.BLOCK_NONE,
//   },
//   {
//     category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//     threshold: HarmBlockThreshold.BLOCK_NONE,
//   },
// ], }) : null;

// Simple chunker if lodash isn't desired: fallback if chunk not available
function chunkByFiles(files = [], maxChars = DEFAULT_MAX_CHARS) {
  const groups = [];
  let current = [];
  let curLen = 0;
  for (const f of files) {
    const len = (f.content || "").length + (f.path || "").length;
    if (curLen + len > maxChars && current.length > 0) {
      groups.push(current);
      current = [f];
      curLen = len;
    } else {
      current.push(f);
      curLen += len;
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

function safeTrim(s, max = 2000) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "..." : s;
}

function guessLangFromName(name = "") {
  const n = name.toLowerCase();
  if (n.endsWith(".ts") || n.endsWith(".tsx")) return "typescript";
  if (n.endsWith(".js") || n.endsWith(".jsx")) return "javascript";
  if (n.endsWith(".py")) return "python";
  if (n.endsWith(".java")) return "java";
  if (n.endsWith(".go")) return "go";
  if (n.endsWith(".rb")) return "ruby";
  if (n.endsWith(".cs")) return "csharp";
  return "text";
}

function estimateTestCount(code) {
  // Simple heuristic: count occurrences of 'it(' or 'test(' or similar patterns.
  // This is a placeholder; a more sophisticated analysis would involve AST parsing.
  const testRegex = /(?:it|test|expect)\(/g;
  return (code.match(testRegex) || []).length || 1;
}

/**
 * Build a prompt for summary generation for a group of files
 */
function buildSummariesPrompt(files, repo) {
  const header = `You are an expert software engineer who writes concise, actionable unit/integration test summaries. Your task is to analyze the provided source code files and generate a JSON array of test summaries. Each summary should cover the key aspects of the file, including its primary functions, potential edge cases, and an estimate of the number of tests required. Additionally, identify any significant interactions or dependencies between files that would warrant integration tests.\n\nFor each file, return an object with the following properties:\n- filePath: The full path to the file.\n- fileName: The name of the file.\n- language: The programming language of the file (e.g., "javascript", "python", "java").\n- summary: A 2-4 sentence description of what should be tested in this file, including happy-path, error handling, and edge conditions.\n- keyFunctions: A list of important functions or methods within the file that should be tested.\n- estimatedTests: An integer representing the estimated number of test cases for this file.\n\nEnsure the output is a valid JSON array and contains ONLY the JSON. Do not include any additional text or markdown code blocks around the JSON.`;

  const fileBlocks = files.map((f, i) => {
    const contentPreview = escapeForLLM(safeTrim(f.content || "", 8000)); // keep payload small
    let analysisDetails = '';
    if (f.analysis && f.analysis.extractedElements) {
      const { functions, classes } = f.analysis.extractedElements;
      if (functions && functions.length > 0) {
        analysisDetails += `Functions: ${escapeForLLM(functions.join(', '))}\n`;
      }
      if (classes && classes.length > 0) {
        analysisDetails += `Classes: ${escapeForLLM(classes.join(', '))}\n`;
      }
    }
    return `--- FILE ${i + 1} ---\npath: ${escapeForLLM(f.path)}\nlanguage: ${f.language || guessLangFromName(f.name || f.path)}\n${analysisDetails ? `Code Analysis:\n${analysisDetails}` : ''}content:\n${contentPreview}\n`;
  });

  return `${header}\n\n${fileBlocks.join("\n")}\n\nReturn JSON array.`;
}

/**
 * Build a prompt to generate an actual test file for a single file + summary
 */
function buildTestCodePrompt(file, summary, framework = "jest", contextFiles = []) {
  let header = `You are an expert test engineer. Your task is to generate a complete, runnable, and well-structured test file in ${framework} for the given source code. Adhere to modern best practices for ${framework}, including necessary imports, setup, teardown, and comprehensive assertions. Use mocks or stubs where dependencies exist. The generated code should be ready to execute.\n\nReturn ONLY the content of the test file. Do not include any surrounding commentary, conversational text, or markdown code blocks outside of the actual test code.`;

  if (framework === "jest") {
    header += `\n\nSpecifically for Jest:\n- Organize tests using 'describe' blocks for logical grouping and 'it' for individual test cases.\n- Use 'expect' with appropriate matchers (e.g., toEqual, toBe, toMatchSnapshot, toThrow, not.toThrow). Consider both positive and negative test cases.\n- Mock external dependencies (e.g., API calls, database interactions, modules) using 'jest.mock()' or 'jest.fn()' to isolate the unit under test.\n- Cover happy paths, edge cases (e.g., empty inputs, boundary conditions), and error handling scenarios.\n- Include setup/teardown logic (e.g., 'beforeEach', 'afterEach') if necessary.`;
  } else if (framework === "pytest") {
    header += `\n\nSpecifically for Pytest:\n- Organize tests using functions prefixed with 'test_'. Use classes for grouping related tests if necessary.\n- Use 'assert' statements for assertions. Avoid complex assertion logic within 'assert' itself; prepare data beforehand.\n- Mock dependencies using 'unittest.mock.patch' or Pytest fixtures (e.g., 'mocker' fixture if pytest-mock is available) to isolate the unit under test.\n- Cover happy paths, edge cases (e.g., empty inputs, boundary conditions), and error handling scenarios.\n- Use Pytest fixtures for setup and teardown logic.`;
  } else if (framework === "junit") {
    header += `\n\nSpecifically for JUnit:\n- Organize tests using classes annotated with '@TestInstance(Lifecycle.PER_CLASS)' or static setup methods. Use methods annotated with '@Test' for individual test cases.\n- Use 'org.junit.jupiter.api.Assertions' for assertions (e.g., assertEquals, assertTrue, assertThrows, assertDoesNotThrow). Consider both positive and negative test cases.\n- Mock dependencies using a mocking framework like Mockito (if available) or manual mocks to isolate the unit under test.\n- Cover happy paths, edge cases (e.g., null inputs, boundary conditions), and exception handling scenarios.\n- Include setup/teardown logic using '@BeforeEach', '@AfterEach', '@BeforeAll', '@AfterAll' as necessary.`;
  } else if (framework === "nunit") {
    header += `\n\nSpecifically for NUnit:\n- Organize tests using classes annotated with '[TestFixture]' and methods annotated with '[Test]' for individual test cases.\n- Use 'NUnit.Framework.Assert' for assertions (e.g., Assert.AreEqual, Assert.IsTrue, Assert.Throws, Assert.DoesNotThrow). Consider both positive and negative test cases.\n- Mock dependencies using a mocking framework like Moq (if available) or manual mocks to isolate the unit under test.\n- Cover happy paths, edge cases (e.g., null inputs, boundary conditions), and exception handling scenarios.\n- Include setup/teardown logic using '[SetUp]' and '[TearDown]' attributes as necessary.`;
  } else if (framework === "go_testing") {
    header += `\n\nSpecifically for Go's built-in testing package:\n- Organize tests using functions prefixed with 'Test' that take a 't *testing.T' argument.\n- Use 't.Fatal', 't.Errorf', 't.Logf' for reporting failures and information. Do not use external assertion libraries.\n- Mock dependencies by passing interfaces or using global variables that can be temporarily swapped for testing. Avoid complex mocking frameworks.\n- Cover happy paths, edge cases (e.g., empty slices, nil pointers, boundary conditions), and error return scenarios.\n- Use 't.Run()' for subtests to organize and execute related tests, and 't.Cleanup()' for teardown logic.`;
  } else if (framework === "rspec") {
    header += `\n\nSpecifically for RSpec:\n- Organize tests using 'describe' and 'context' blocks for logical grouping, and 'it' for individual test examples.\n- Use RSpec's built-in matchers (e.g., expect(actual).to eq(expected), to be_true, to raise_error, not_to raise_error). Consider both positive and negative test cases.\n- Mock or stub dependencies using 'allow(...).to receive(...)' or 'double()' to isolate the unit under test.\n- Cover happy paths, edge cases (e.g., empty collections, nil values, boundary conditions), and exception handling scenarios.\n- Include setup/teardown logic using 'before' and 'after' blocks (e.g., 'before { ' or 'after :each { ').`;
  }

  let contextSection = "";
  if (contextFiles && contextFiles.length > 0) {
    contextSection = "\n\n# Reference Code (Dependencies):\n" + contextFiles.map(cf => 
      `File: ${escapeForLLM(cf.path)}\n\`\`\`${guessLangFromName(cf.name)}\n${escapeForLLM(safeTrim(cf.content, 5000))}\n\`\`\``
    ).join("\n\n");
  }

  const fileContent = escapeForLLM(safeTrim(file.content || "", 20000));
  const summaryStr = escapeForLLM(typeof summary === "string" ? summary : JSON.stringify(summary, null, 2));

  return `${header}${contextSection}\n\n# Source File: ${escapeForLLM(file.path)}\`\`\`${file.language || guessLangFromName(file.name || file.path)}\n${fileContent}\`\`\`\n\n# Test Summary:\`\`\`json\n${summaryStr}\`\`\`\n\n// Based on the above source file, reference dependencies, and test summary, generate the complete ${framework} test file below.\n`;
}

function buildExplanationPrompt(file, contextFiles = []) {
  let header = `You are an expert software engineer and educator. Your task is to explain the provided source code in simple, readable steps.
  
  Requirements:
  - Analyze the code structure, logic, and purpose.
  - Identify key functions, variables, and control flows.
  - Explain tricky or complex parts in detail.
  - Add comments where helpful.
  - Do NOT generate test cases.
  - Do NOT modify the code logic.
  - Output should be in Markdown format.
  - Use sections like "### Function: name()", "### Logic Flow", etc.
  `;

  let contextSection = "";
  if (contextFiles && contextFiles.length > 0) {
    contextSection = "\n\n# Reference Code (Dependencies):\n" + contextFiles.map(cf => 
      `File: ${escapeForLLM(cf.path)}\n\`\`\`${guessLangFromName(cf.name)}\n${escapeForLLM(safeTrim(cf.content, 5000))}\n\`\`\``
    ).join("\n\n");
  }

  const fileContent = escapeForLLM(safeTrim(file.content || "", 20000));

  return `${header}${contextSection}\n\n# Source File: ${escapeForLLM(file.path)}\`\`\`${file.language || guessLangFromName(file.name || file.path)}\n${fileContent}\`\`\`\n\n// Based on the above source file and reference dependencies, provide a detailed explanation of the code below.\n`;
}

/**
 * Minimal provider sender — adapt to your provider.
 * For OpenAI-like APIs: POST to /v1/chat/completions with messages.
 * For simpler text endpoints: POST { input: prompt }.
 */
async function sendToProvider(prompt, opts = {}) {
  if (LLM_PROVIDER === "gemini") {
    if (!geminiModel) throw new Error("Gemini LLM provider not configured (GEMINI_API_KEY)");
    try {
      const result = await geminiModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: opts.max_tokens || 1600,
          temperature: opts.temperature ?? 0.2,
        },
      });
      const response = await result.response;
      return response.text();
    } catch (err) {
      const msg = err?.response?.data || err.message || String(err);
      throw new Error(`Gemini LLM request failed: ${safeTrim(JSON.stringify(msg), 1000)}`);
    }
  } else if (LLM_PROVIDER === "openrouter") {
    if (!OPENROUTER_API_KEY) throw new Error("OpenRouter LLM provider not configured (OPENROUTER_API_KEY)");
    try {
      const response = await axios.post(OPENROUTER_API_URL, {
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: opts.max_tokens || 1600,
        temperature: opts.temperature ?? 0.2,
      }, {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000', // Replace with your app's URL
          'X-Title': 'GitHub Test Case Generator',
        },
      });
      return response.data.choices[0].message.content;
    } catch (err) {
      const msg = err?.response?.data || err.message || String(err);
      throw new Error(`OpenRouter LLM request failed: ${safeTrim(JSON.stringify(msg), 1000)}`);
    }
  } else if (LLM_PROVIDER === "openai") {
    if (!OPENAI_API_KEY) throw new Error("OpenAI LLM provider not configured (OPENAI_API_KEY)");
    // OpenAI API integration would go here, similar to OpenRouter using axios
    // For now, we'll throw an error if not implemented
    throw new Error("OpenAI LLM provider not yet implemented.");
  } else {
    throw new Error(`Unsupported LLM_PROVIDER: ${LLM_PROVIDER}`);
  }
}

/**
 * Public: generateSummaries
 * Accepts: { files, repo, user }
 * Returns: [ { filePath, fileName, language, summary, keyFunctions, estimatedTests } ]
 */
export async function generateSummaries({ files = [], repo = null, user = null } = {}) {
  // Ensure model is initialized
  if (LLM_PROVIDER === "gemini" && !geminiModel) {
    throw new Error('AI model not initialized. Please check your API key and configuration.');
  } else if (LLM_PROVIDER === "openrouter" && !OPENROUTER_API_KEY) {
    throw new Error('AI model not initialized. Please check your API key and configuration.');
  }

  // chunk files into manageable groups for the LLM
  const groups = chunkByFiles(files, DEFAULT_MAX_CHARS);

  const allSummaries = [];

  for (const g of groups) {
    const prompt = buildSummariesPrompt(g, repo);
    let raw;
    try {
      raw = await sendToProvider(prompt, { max_tokens: 2000 });
    } catch (err) {
      logger.error("generateSummaries provider error:", err);
      throw new Error(`Failed to generate summaries: ${err.message}`);
    }

    // Attempt to parse JSON out of raw response (strip Code fences if present)
    const text = typeof raw === "string" ? raw : JSON.stringify(raw);
    
    // Improved JSON extraction: Look for the first '[' and last ']'
    const startIdx = text.indexOf("[");
    const endIdx = text.lastIndexOf("]");
    
    let parsed = null;
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = text.substring(startIdx, endIdx + 1);
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        logger.warn("JSON.parse failed, attempting manual cleanup...", e.message);
        // Fallback: try to clean up common LLM artifacts like trailing commas or single quotes
        try {
          const cleaned = jsonStr
            .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
            .replace(/'/g, '"'); // replace single quotes with double quotes (risky but sometimes needed)
          parsed = JSON.parse(cleaned);
        } catch (ee) {
          // Final fallback: attempt a more aggressive regex cleanup for common LLM artifacts
          try {
            const aggressiveCleanup = jsonStr
              .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Quote unquoted keys
              .replace(/'/g, '"') // Replace single quotes with double quotes
              .replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas
            parsed = JSON.parse(aggressiveCleanup);
          } catch (eee) {
            logger.error("All JSON parsing attempts failed, including aggressive cleanup.");
            parsed = null;
          }
        }
      }
    }

    if (Array.isArray(parsed)) {
      // Normalize parsed items
      const normalized = parsed.map((p) => ({
        filePath: p.filePath || p.path || p.file || p.name,
        fileName: p.fileName || (p.filePath || p.path || p.file || "").split("/").pop(),
        language: p.language || guessLangFromName(p.file || p.filePath || p.path),
        summary: p.summary || p.description || "",
        keyFunctions: p.keyFunctions || p.functions || [],
        estimatedTests: Math.max(1, parseInt(p.estimatedTests || p.estimated_tests || 0, 10) || (p.keyFunctions ? p.keyFunctions.length : 1)),
      }));
      allSummaries.push(...normalized);
    } else {
      // Could not parse JSON: fallback to single summary per file using simple split by file name
      const fallback = g.map((f) => ({
        filePath: f.path,
        fileName: f.name || f.path.split("/").pop(),
        language: f.language || guessLangFromName(f.name || f.path),
        summary: safeTrim(text, 400),
        keyFunctions: [],
        estimatedTests: 1,
      }));
      allSummaries.push(...fallback);
    }
  } // groups

  return allSummaries;
}

/**
 * Public: generateTestCode
 * Accepts: { file, summaryId, framework, user, contextFiles }
 * Returns: { code, summary, language }
 */
export async function generateTestCode({ file, summaryId, framework, user, contextFiles = [] }) {
  // Ensure model is initialized
  if (LLM_PROVIDER === "gemini" && !geminiModel) {
    throw new Error('AI model not initialized. Please check your API key and configuration.');
  } else if (LLM_PROVIDER === "openrouter" && !OPENROUTER_API_KEY) {
    throw new Error('AI model not initialized. Please check your API key and configuration.');
  }
  try {
    // Sanitize the generated code from the AI as an extra precaution before returning
    const prompt = buildTestCodePrompt(file, summaryId, framework, contextFiles);
    const result = await sendToProvider(prompt);
    const sanitizedCode = sanitizeCodeString(result); // Apply sanitization here
    
    return {
      code: sanitizedCode,
      summary: {
        fileName: file.name,
        filePath: file.path,
        language: guessLangFromName(file.name),
        estimatedTests: estimateTestCount(sanitizedCode)
      },
      language: guessLangFromName(file.name)
    };
  } catch (error) {
    logger.error('Error generating test code:', error);
    throw error;
  }
}

/**
 * Public: generateExplanation
 * Accepts: { file, contextFiles, user }
 * Returns: markdown string
 */
export async function generateExplanation({ file, contextFiles = [], user }) {
  // Ensure model is initialized
  if (LLM_PROVIDER === "gemini" && !geminiModel) {
    throw new Error('AI model not initialized. Please check your API key and configuration.');
  } else if (LLM_PROVIDER === "openrouter" && !OPENROUTER_API_KEY) {
    throw new Error('AI model not initialized. Please check your API key and configuration.');
  }
  try {
    const prompt = buildExplanationPrompt(file, contextFiles);
    const result = await sendToProvider(prompt);
    return result;
  } catch (error) {
    logger.error('Error generating explanation:', error);
    throw error;
  }
}

/**
 * Public: generateChatResponse
 * Accepts: prompt string
 * Returns: { message, suggestedCode, recommendations, coverage, missingTests, suggestions }
 */
export async function generateChatResponse(prompt) {
  // Ensure model is initialized
  if (LLM_PROVIDER === "gemini" && !geminiModel) {
    throw new Error('AI model not initialized. Please check your API key and configuration.');
  } else if (LLM_PROVIDER === "openrouter" && !OPENROUTER_API_KEY) {
    throw new Error('AI model not initialized. Please check your API key and configuration.');
  }
  try {
    const result = await sendToProvider(prompt, { max_tokens: 2000 });
    
    // Parse the AI response to extract structured information
    const parsed = parseChatResponse(result);
    
    return {
      message: parsed.message,
      suggestedCode: parsed.suggestedCode,
      recommendations: parsed.recommendations,
      coverage: parsed.coverage,
      missingTests: parsed.missingTests,
      suggestions: parsed.suggestions
    };
  } catch (error) {
    logger.error('Error generating chat response:', error);
    throw error;
  }
}

/**
 * Parse AI chat response to extract structured information
 */
function parseChatResponse(response) {
  // Simple parsing - in production, you might want more sophisticated parsing
  const lines = response.split('\n');
  let message = '';
  let suggestedCode = '';
  let recommendations = [];
  let coverage = '';
  let missingTests = [];
  let suggestions = [];

  let currentSection = 'message';
  
  for (const line of lines) {
    if (line.includes('```')) {
      if (suggestedCode === '') {
        currentSection = 'code';
      } else {
        currentSection = 'recommendations';
      }
      continue;
    }
    
    if (currentSection === 'message') {
      message += line + '\n';
    } else if (currentSection === 'code') {
      suggestedCode += line + '\n';
    } else if (currentSection === 'recommendations') {
      if (line.trim()) {
        recommendations.push(line.trim());
      }
    }
  }

  return {
    message: message.trim(),
    suggestedCode: suggestedCode.trim(),
    recommendations,
    coverage,
    missingTests,
    suggestions
  };
}

export default {
  generateSummaries,
  generateTestCode,
  generateChatResponse,
  generateExplanation,
};
