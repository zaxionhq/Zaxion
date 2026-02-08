/**
 * Advisor Service
 * Provides non-gating intelligence, explanations, and fix intents.
 * This service is "best-effort" and must not influence the deterministic decision.
 */
import * as logger from "../utils/logger.js";

export class AdvisorService {
  constructor(llmService) {
    this.llmService = llmService;
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

      // 2. Generate Fix Intents (Intent-level, not code-level)
      // For now, using deterministic mapping, but this is where LLM integration happens in Phase 4/5.
      const suggestedTestIntents = highRiskFiles.map(f => {
        const fileName = f.split('/').pop().split('.')[0];
        return {
          file: f,
          intent: `Verify ${fileName} logic stability`,
          rationale: `This file is categorized as high-risk and requires validation to satisfy quality gates.`
        };
      });

      // 3. Explanation/Rationale
      let rationale = "AI suggests focusing tests on modified business logic.";
      if (isBlocked) {
        rationale = "Deterministic policy blocked this PR. The advisor recommends adding the missing test intents listed below to satisfy the security and quality gate.";
      }

      return {
        riskAssessment: {
          level: riskLevel,
          confidence: 0.85 // Placeholder for LLM confidence
        },
        suggestedTestIntents,
        rationale,
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
}
