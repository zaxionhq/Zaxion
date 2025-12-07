// backend/src/utils/sanitization.utils.js

import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

// Initialize DOMPurify with jsdom
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Escapes text intended for consumption by an LLM to mitigate prompt injection.
 * This primarily focuses on markdown-like formatting that could be interpreted
 * as new instructions by the model.
 * @param {string} text - The input text to escape.
 * @returns {string} The escaped text.
 */
export function escapeForLLM(text) {
  if (typeof text !== 'string') return '';
  // Escape characters that might prematurely end a code block or be interpreted as new instructions.
  // This is a heuristic and may need refinement based on LLM behavior.
  let escapedText = text;
  escapedText = escapedText.replace(/```/g, '`&#x60;`'); // Escape backticks that might form code blocks
  escapedText = escapedText.replace(/\n/g, '\n'); // Newlines are usually fine but explicit escape can be considered
  escapedText = escapedText.replace(/\*/g, '\*'); // Escape asterisks (bold/italic markdown)
  escapedText = escapedText.replace(/_/g, '_'); // Escape underscores (italic markdown)
  escapedText = escapedText.replace(/#/g, '#'); // Escape hash (header markdown)
  escapedText = escapedText.replace(/>/g, '>'); // Escape blockquotes
  escapedText = escapedText.replace(/`/g, '`'); // Escape single backticks (inline code)
  return escapedText;
}

/**
 * Sanitizes HTML content to prevent XSS attacks using DOMPurify.
 * Note: This requires 'jsdom' and 'dompurify' to be installed.
 * @param {string} html - The HTML string to sanitize.
 * @returns {string} The sanitized HTML string.
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html);
}

/**
 * Performs basic sanitization on code strings. This is a preliminary measure
 * and does NOT replace robust sandboxing or secure execution environments.
 * Focuses on stripping common dangerous constructs.
 * @param {string} code - The code string to sanitize.
 * @returns {string} The sanitized code string.
 */
export function sanitizeCodeString(code) {
  if (typeof code !== 'string') return '';

  let sanitized = code;

  // Remove or neutralize potentially dangerous shell commands or system calls
  // This list is not exhaustive and highly dependent on execution environment.
  sanitized = sanitized.replace(/process\.exit\s*\([0-9]*\)/g, '/* process.exit removed */');
  sanitized = sanitized.replace(/child_process\.(exec|spawn|execSync|spawnSync)/g, '/* shell command removed */');
  sanitized = sanitized.replace(/fs\.(rm|unlink|rmSync|unlinkSync)/g, '/* file deletion removed */');

  // Prevent common script injection attempts (if code is ever rendered as HTML/JS)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '/* script removed */');
  sanitized = sanitized.replace(/on[a-zA-Z]+\s*=/g, ' '); // Remove event handlers

  // Limit file system access attempts (Node.js specific)
  sanitized = sanitized.replace(/require\(['"`\\]*fs['"`\\]*\)/g, '/* fs import removed */');
  sanitized = sanitized.replace(/import\s*(\{.*?\}|\w+)\s*from\s*['"`\\]*fs['"`\\]*/g, '/* fs import removed */');

  return sanitized;
}

