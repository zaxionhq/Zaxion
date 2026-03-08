// src/services/llm.service.js
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import axios from "axios";
import { escapeForLLM, sanitizeCodeString } from "../utils/sanitization.utils.js";
import * as logger from "../utils/logger.js";
import env from "../config/env.js";

const LLM_PROVIDER = env.get("LLM_PROVIDER") || "gemini";
const GEMINI_API_KEY = env.get("GEMINI_API_KEY") || "";
const CLAUDE_API_KEY = env.get("CLAUDE_API_KEY") || "";
const NVIDIA_API_KEY = env.get("NVIDIA_API_KEY") || "";
const OPENROUTER_API_KEY = env.get("OPENROUTER_API_KEY") || "";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_MAX_CHARS = parseInt(process.env.LLM_MAX_CHARS || "24000", 10);

let genAI = null;
let geminiModel = null;

if (LLM_PROVIDER === "gemini" && GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  });
}

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

function buildSummariesPrompt(files, repo) {
  const header = `You are an expert software engineer. Analyze the provided source code files and generate a JSON array of test summaries. 
  For each file, return an object with:
  - filePath: full path
  - fileName: name
  - language: e.g. "javascript"
  - summary: 2-4 sentence description of tests needed (happy-path, error, edge)
  - keyFunctions: list of important functions
  - estimatedTests: integer estimate
  
  Output ONLY the JSON array.`;

  const fileBlocks = files.map((f, i) => {
    const contentPreview = escapeForLLM(safeTrim(f.content || "", 8000));
    return `--- FILE ${i + 1} ---\npath: ${escapeForLLM(f.path)}\nlanguage: ${f.language || guessLangFromName(f.name || f.path)}\ncontent:\n${contentPreview}\n`;
  });

  return `${header}\n\n${fileBlocks.join("\n")}\n\nReturn JSON array.`;
}

function buildTestCodePrompt(file, summary, framework = "jest", contextFiles = []) {
  let header = `You are an expert test engineer. Generate a complete, runnable test file in ${framework} for the source code. Use modern best practices for ${framework}. 
  Return ONLY the code. No markdown code blocks.`;

  let contextSection = "";
  if (contextFiles && contextFiles.length > 0) {
    contextSection = "\n\n# Reference Code (Dependencies):\n" + contextFiles.map(cf => 
      `File: ${escapeForLLM(cf.path)}\n${escapeForLLM(safeTrim(cf.content, 5000))}\n`
    ).join("\n\n");
  }

  const fileContent = escapeForLLM(safeTrim(file.content || "", 20000));
  const summaryStr = escapeForLLM(typeof summary === "string" ? summary : JSON.stringify(summary, null, 2));

  return `${header}${contextSection}\n\n# Source File: ${escapeForLLM(file.path)}\n${fileContent}\n\n# Test Summary:\n${summaryStr}\n`;
}

function buildExplanationPrompt(file, contextFiles = []) {
  let header = `You are an expert software engineer. Explain the provided source code in simple steps. Use Markdown.`;
  
  let contextSection = "";
  if (contextFiles && contextFiles.length > 0) {
    contextSection = "\n\n# Reference Code (Dependencies):\n" + contextFiles.map(cf => 
      `File: ${escapeForLLM(cf.path)}\n${escapeForLLM(safeTrim(cf.content, 5000))}\n`
    ).join("\n\n");
  }

  const fileContent = escapeForLLM(safeTrim(file.content || "", 20000));
  return `${header}${contextSection}\n\n# Source File: ${escapeForLLM(file.path)}\n${fileContent}\n`;
}

async function sendToProvider(prompt, opts = {}) {
  switch (LLM_PROVIDER) {
    case "gemini": {
      if (!geminiModel) throw new Error("Gemini API Key missing.");
      const gResult = await geminiModel.generateContent(prompt);
      return gResult.response.text();
    }

    case "claude": {
      if (!CLAUDE_API_KEY) throw new Error("Claude API Key missing.");
      const cRes = await axios.post(CLAUDE_API_URL, {
        model: "claude-3-5-sonnet-20240620",
        max_tokens: opts.max_tokens || 2048,
        messages: [{ role: "user", content: prompt }]
      }, {
        headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }
      });
      return cRes.data.content[0].text;
    }

    case "nvidia": {
      if (!NVIDIA_API_KEY) throw new Error("NVIDIA API Key missing.");
      const nRes = await axios.post(NVIDIA_API_URL, {
        model: "meta/llama-3.1-405b-instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: opts.max_tokens || 2048,
        temperature: opts.temperature ?? 0.2,
      }, {
        headers: { "Authorization": `Bearer ${NVIDIA_API_KEY}`, "Accept": "application/json" }
      });
      return nRes.data.choices[0].message.content;
    }

    case "openrouter": {
      if (!OPENROUTER_API_KEY) throw new Error("OpenRouter API Key missing.");
      const orRes = await axios.post(OPENROUTER_API_URL, {
        model: process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct:free",
        messages: [{ role: "user", content: prompt }]
      }, {
        headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}` }
      });
      return orRes.data.choices[0].message.content;
    }

    default:
      throw new Error(`Unsupported provider: ${LLM_PROVIDER}`);
  }
}

export async function generateSummaries({ files = [], repo = null, user = null } = {}) {
  const groups = chunkByFiles(files, DEFAULT_MAX_CHARS);
  const allSummaries = [];

  for (const g of groups) {
    const prompt = buildSummariesPrompt(g, repo);
    const raw = await sendToProvider(prompt);
    
    // JSON extraction logic (simplified for brevity)
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start !== -1 && end !== -1) {
      try {
        const parsed = JSON.parse(raw.substring(start, end + 1));
        allSummaries.push(...parsed.map(p => ({
          filePath: p.filePath || p.path,
          fileName: p.fileName || (p.filePath || "").split("/").pop(),
          language: p.language || guessLangFromName(p.filePath),
          summary: p.summary || "",
          keyFunctions: p.keyFunctions || [],
          estimatedTests: p.estimatedTests || 1
        })));
      } catch (e) {
        logger.error("JSON parse failed", e);
      }
    }
  }
  return allSummaries;
}

export async function generateTestCode({ file, summary, framework = "jest", contextFiles = [] } = {}) {
  const prompt = buildTestCodePrompt(file, summary, framework, contextFiles);
  const code = await sendToProvider(prompt, { temperature: 0.1, max_tokens: 4096 });
  return { code: sanitizeCodeString(code), filename: `test.${file.path.split('.').pop()}`, language: file.language || guessLangFromName(file.path) };
}

export async function generateExplanation({ file, contextFiles = [] } = {}) {
  const prompt = buildExplanationPrompt(file, contextFiles);
  return await sendToProvider(prompt);
}

export async function generateChatResponse(prompt) {
  const response = await sendToProvider(prompt);
  // Basic parsing for chat structure
  return { message: response.trim(), suggestedCode: "", recommendations: [] };
}

export default {
  generateSummaries,
  generateTestCode,
  generateChatResponse,
  generateExplanation,
};