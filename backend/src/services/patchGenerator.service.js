import { LlmService } from "./llm.service.js";
import * as logger from "../utils/logger.js";

/**
 * Phase 8.4: Automated Patch Generation Engine
 * Generates `git apply` compatible patches for deterministic violations.
 */
export class PatchGeneratorService {
  constructor() {
    this.llmService = new LlmService();
  }

  /**
   * Generates a fix patch for a given violation
   * @param {object} violation - The structured violation
   * @param {string} fileContent - The current content of the file
   * @returns {Promise<string|null>} The generated patch or null if generation fails
   */
  async generatePatch(violation, fileContent) {
    if (!fileContent) return null;

    try {
      const prompt = `You are an expert AI code refactoring engine.
A deterministic policy engine has flagged a violation in the following file.

VIOLATION DETAILS:
Rule ID: ${violation.rule_id}
Message: ${violation.message}
Severity: ${violation.severity}
Problematic Value: ${violation.actual}
Remediation Steps: ${violation.remediation?.steps?.join(', ') || 'Fix the issue.'}

FILE CONTENT:
\`\`\`
${fileContent}
\`\`\`

INSTRUCTIONS:
1. Fix the violation according to the remediation steps.
2. Return ONLY a valid unified diff (git patch format) that can be applied to fix the issue.
3. Do not include any explanations, markdown code blocks, or greetings. Just the raw diff.
4. The diff must start with '--- a/${violation.file}' and '+++ b/${violation.file}'.`;

      const response = await this.llmService.generateChatResponse(prompt);
      const patch = response.message;

      // Basic validation to ensure it looks like a patch
      if (patch.startsWith('--- a/') || patch.includes('@@ -')) {
        // Strip markdown if the LLM accidentally wrapped it
        return patch.replace(/^```diff\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
      }

      return null;
    } catch (error) {
      logger.warn("[PatchGenerator] Failed to generate patch:", error.message);
      return null;
    }
  }
}