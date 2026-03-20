/**
 * Advisor Service
 * Provides non-gating intelligence, explanations, and fix intents.
 * This service is "best-effort" and must not influence the deterministic decision.
 */
import * as logger from "../utils/logger.js";
import { PatchGeneratorService } from "./patchGenerator.service.js";

export class AdvisorService {
  constructor(llmService) {
    this.llmService = llmService;
    this.patchGenerator = new PatchGeneratorService();
  }

  /**
   * Enrich a deterministic decision with advisory context.
   * @param {object} decision - The deterministic decision from PolicyEngine
   * @param {object} prContext - The PR context from DiffAnalyzer
   * @returns {Promise<object>} AdvisorObject
   */
  async enrich(decision, prContext) {
    try {
      const highRiskFiles = prContext.categories.highRisk || [];
      const isBlocked = decision.decision === "BLOCK";
      const isWarned = decision.decision === "WARN";

      // 1. Risk Assessment (Derivative intelligence)
      const riskLevel = isBlocked ? "HIGH" : (isWarned ? "MEDIUM" : "LOW");

      // Phase 2: Secondary Refiner Layer & Phase 8.3 Style Embedding
      let confidenceScore = 0.85;
      let refinementRationale = "";
      let styleAlignmentScore = 1.0;
      
      if (this.llmService && (isBlocked || isWarned)) {
        try {
          const refinerPrompt = this._buildRefinerPrompt(decision, prContext);
          const aiResponse = await this.llmService.generateChatResponse(refinerPrompt);
          
          if (aiResponse && aiResponse.message) {
            const parsed = this._parseRefinerResponse(aiResponse.message);
            confidenceScore = parsed.confidence || confidenceScore;
            refinementRationale = parsed.rationale || "";
            styleAlignmentScore = parsed.styleAlignmentScore !== undefined ? parsed.styleAlignmentScore : 1.0;
            
            if (parsed.isFalsePositive && decision.decision === "BLOCK") {
              decision.advisor_flags = {
                potential_false_positive: true,
                ai_confidence: confidenceScore,
                ai_rationale: refinementRationale,
                style_alignment: styleAlignmentScore
              };
            }
          }
        } catch (llmErr) {
          logger.warn("[AdvisorService] Refiner layer failed:", llmErr.message);
        }
      }

      // Phase 8.4: Proactive Patch Generation
      const generatedPatches = [];
      if (decision.violations && decision.violations.length > 0 && prContext.files) {
        for (const violation of decision.violations) {
          if (violation.severity === 'BLOCK') {
            const fileData = prContext.files.find(f => f.filename === violation.file);
            if (fileData && fileData.content) {
              const patch = await this.patchGenerator.generatePatch(violation, fileData.content);
              if (patch) {
                generatedPatches.push({
                  rule_id: violation.rule_id,
                  file: violation.file,
                  patch
                });
                // Attach to the violation object for the UI
                violation.suggested_patch = patch;
              }
            }
          }
        }
      }

      // 2. Generate Fix Intents (Intent-level, not code-level)
      // For now, using deterministic mapping, but this is where LLM integration happens in Phase 4/5.
      let suggestedTestIntents = highRiskFiles.map(f => {
        const fileName = f.split('/').pop().split('.')[0];
        return {
          file: f,
          intent: `Verify ${fileName} logic stability`,
          rationale: `This file is categorized as high-risk and requires validation to satisfy quality gates.`
        };
      });

      // 2.1 Enrich with specific security violation intents
      if (decision.violations && decision.violations.length > 0) {
        decision.violations.forEach(v => {
           if (v.file && (v.rule_id === 'security_patterns' || v.rule_id === 'dependency_scan')) {
             suggestedTestIntents.push({
               file: v.file,
               intent: `Remediate security violation: ${v.message}`,
               rationale: `Detected ${v.rule_id} violation. Immediate fix required.`
             });
           }
        });
      }

      // Deduplicate intents
      suggestedTestIntents = [...new Map(suggestedTestIntents.map(item => [item.file + item.intent, item])).values()];

      // 3. Explanation/Rationale
      let rationale = "AI suggests focusing tests on modified business logic.";
      if (isBlocked) {
        rationale = "Deterministic policy blocked this PR. The advisor recommends adding the missing test intents listed below to satisfy the security and quality gate.";
      }

      return {
        riskAssessment: {
          level: riskLevel,
          confidence: confidenceScore,
          styleAlignmentScore // Phase 8.3 Check
        },
        suggestedTestIntents,
        generatedPatches, // Phase 8.4 Payload
        rationale: refinementRationale || rationale,
        status: "SUCCESS",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error("[AdvisorService] Enrichment failed:", error);
      // Best-effort rule: return a graceful fallback if enrichment fails
      return {
        status: "UNAVAILABLE",
        rationale: "Advisor service is currently unavailable. Decision remains valid and based on deterministic policy.",
        riskAssessment: { level: "UNKNOWN", confidence: 0 },
        suggestedTestIntents: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Phase 2: Build Refiner Prompt
   */
  _buildRefinerPrompt(decision, prContext) {
    const violations = decision.violations || [];
    const violationSummary = violations.map(v => `- [${v.rule_id}] in ${v.file}: ${v.message} (Value: ${v.actual})`).join('\n');
    
    return `You are a Senior Engineering Refiner for Zaxion Governance. 
Review the following deterministic violations found in a Pull Request and identify potential false positives.

CONTEXT:
Base Branch: ${prContext.metadata?.base_branch || 'main'}
High Risk Areas: ${prContext.categories?.highRisk?.join(', ') || 'None'}

VIOLATIONS:
${violationSummary}

INSTRUCTIONS:
1. Identify if any violation is a false positive (e.g., port assignment flagged as magic number, dynamic URL construction flagged as hardcoded).
2. Assign a confidence score (0.0 to 1.0) for your assessment.
3. Provide a brief technical rationale for your verdict.

Output ONLY a JSON object in this format:
{
  "isFalsePositive": boolean,
  "confidence": number,
  "rationale": "string",
  "styleAlignmentScore": number // 0.0 to 1.0 indicating how well this code matches enterprise standards
}`;
  }

  /**
   * Phase 2: Parse Refiner Response
   */
  _parseRefinerResponse(aiMessage) {
    try {
      const start = aiMessage.indexOf('{');
      const end = aiMessage.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(aiMessage.substring(start, end + 1));
      }
    } catch (e) {
      logger.warn("[AdvisorService] Failed to parse refiner JSON:", e.message);
    }
    return { isFalsePositive: false, confidence: 0.85, rationale: "", styleAlignmentScore: 1.0 };
  }
}
