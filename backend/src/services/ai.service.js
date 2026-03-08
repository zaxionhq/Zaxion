// src/services/ai.service.js
/**
 * Smart mock that "analyzes" file names and produces sensible summaries & code.
 * Swap this later with a real model (Gemini, OpenRouter, etc.)
 */

// Removed internal guessLang as it's handled by gemini.service.js now

import * as llmService from "./llm.service.js";
import env from "../config/env.js";
import { aiServiceCallCounter } from "../utils/metrics.js";
import { chunkFile } from "./chunking.service.js";
import * as logger from "../utils/logger.js";

const LLM_PROVIDER = env.get("LLM_PROVIDER") || "gemini";
const GEMINI_API_KEY = env.get("GEMINI_API_KEY");
const CLAUDE_API_KEY = env.get("CLAUDE_API_KEY");
const NVIDIA_API_KEY = env.get("NVIDIA_API_KEY");
const OPENROUTER_API_KEY = env.get("OPENROUTER_API_KEY");

export async function generateTestCaseSummaries({ files, repo, user }) {
  const operation = 'generateTestCaseSummaries';
  let status = 'success';
  try {
    validateConfig();
    return await llmService.generateSummaries({ files, repo, user });
  } catch (error) {
    status = 'failure';
    throw error;
  } finally {
    aiServiceCallCounter.inc({ service: LLM_PROVIDER, operation, status });
  }
}

function validateConfig() {
  if (LLM_PROVIDER === 'gemini' && !GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required when LLM_PROVIDER="gemini"');
  }
  if (LLM_PROVIDER === 'claude' && !CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY is required when LLM_PROVIDER="claude"');
  }
  if (LLM_PROVIDER === 'nvidia' && !NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is required when LLM_PROVIDER="nvidia"');
  }
  if (LLM_PROVIDER === 'openrouter' && !OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is required when LLM_PROVIDER="openrouter"');
  }
}

export async function generateTestCode({ summaryId, files, framework, user, contextFiles = [], mode = 'test' }) {
  const operation = 'generateTestCode';
  let status = 'success';
  try {
    validateConfig();
    
    let file = files.find(f => f.path === summaryId) || files[0]; // Assuming summaryId can be file path for direct code gen
    
    // Chunking Integration: If file is large, analyze structure
    if (file && file.content && file.content.length > 2000) {
      try {
        const chunks = await chunkFile(file);
        const structureSummary = chunks
          .filter(c => c.type !== 'module_gap')
          .map(c => `- ${c.type.toUpperCase()} (Lines ${c.startLine}-${c.endLine}): ${c.summary}`)
          .join('\n');
        
        if (structureSummary) {
          // Create a shallow copy to avoid mutating the original file object used elsewhere
          file = {
            ...file,
            content: `/* File Structure Analysis:\n${structureSummary}\n*/\n\n${file.content}`
          };
        }
      } catch (chunkErr) {
        logger.warn(`Chunking failed for ${file.path}:`, chunkErr.message);
        // Proceed with original content
      }
    }

    if (mode === 'explain') {
      const explanation = await llmService.generateExplanation({ file, contextFiles, user });
      return { code: explanation, filename: 'explanation.md', language: 'markdown' };
    }

    return await llmService.generateTestCode({ file, summaryId, framework, user, contextFiles });
  } catch (error) {
    status = 'failure';
    throw error;
  } finally {
    aiServiceCallCounter.inc({ service: LLM_PROVIDER, operation, status });
  }
}

export async function generateChatResponse(prompt) {
  const operation = 'generateChatResponse';
  let status = 'success';
  try {
    validateConfig();
    return await llmService.generateChatResponse(prompt);
  } catch (error) {
    status = 'failure';
    throw error;
  } finally {
    aiServiceCallCounter.inc({ service: LLM_PROVIDER, operation, status });
  }
}

export async function generateExplanation({ file, contextFiles, user }) {
  const operation = 'generateExplanation';
  let status = 'success';
  try {
    validateConfig();
    return await llmService.generateExplanation({ file, contextFiles, user });
  } catch (error) {
    status = 'failure';
    throw error;
  } finally {
    aiServiceCallCounter.inc({ service: LLM_PROVIDER, operation, status });
  }
}
