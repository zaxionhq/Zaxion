/**
 * LLM-generated detailed BLOCK/WARN explanations (non-authoritative overlay).
 */
import env from '../config/env.js';
import * as logger from '../utils/logger.js';
import { escapeForLLM } from '../utils/sanitization.utils.js';

const MAX_VIOLATIONS = parseInt(env.get('ADVISOR_EXPLAIN_MAX_VIOLATIONS') || '8', 10);
const TIMEOUT_MS = parseInt(env.get('ADVISOR_EXPLAIN_TIMEOUT_MS') || '15000', 10);

/**
 * @returns {boolean}
 */
export function isLlmAvailable() {
  const provider = env.get('LLM_PROVIDER') || 'gemini';
  const keys = {
    gemini: env.get('GEMINI_API_KEY'),
    claude: env.get('CLAUDE_API_KEY'),
    nvidia: env.get('NVIDIA_API_KEY'),
    openrouter: env.get('OPENROUTER_API_KEY'),
  };
  return Boolean(keys[provider]);
}

/**
 * @returns {boolean}
 */
export function shouldEnrichExplanations() {
  const flag = env.get('ADVISOR_ENRICH_EXPLANATIONS');
  if (flag === 'false' || flag === '0') return false;
  return isLlmAvailable();
}

export class ViolationExplainerService {
  constructor(llmService) {
    this.llmService = llmService;
  }

  /**
   * @param {object} params
   * @param {object} params.decision - deterministic decision snapshot
   * @param {object} [params.prContext]
   * @param {object[]} [params.violations]
   */
  async explainViolations({ decision, prContext = {}, violations }) {
    if (!shouldEnrichExplanations() || !this.llmService) {
      return { enriched: false, violations: violations || decision.violations || [] };
    }

    const verdict = decision.decision;
    if (verdict !== 'BLOCK' && verdict !== 'WARN') {
      return { enriched: false, violations: violations || decision.violations || [] };
    }

    const list = (violations || decision.violations || []).slice(0, MAX_VIOLATIONS);
    if (list.length === 0) {
      return { enriched: false, violations: [] };
    }

    try {
      const prompt = this._buildPrompt(decision, list, prContext);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Explainer timeout')), TIMEOUT_MS)
      );
      const aiResponse = await Promise.race([
        this.llmService.generateChatResponse(prompt),
        timeoutPromise,
      ]);

      const parsed = this._parseResponse(aiResponse?.message || aiResponse);
      return this._mergeExplanations(list, parsed);
    } catch (err) {
      logger.warn('[ViolationExplainer] Failed:', err.message);
      return { enriched: false, violations: list, decision_summary: null };
    }
  }

  _buildPrompt(decision, violations, prContext) {
    const violationLines = violations.map((v) => {
      const snippet = this._snippetFor(v, prContext);
      return `- [${v.rule_id}] ${v.file || 'N/A'}:${v.line || '?'} — ${v.message}
  current: ${escapeForLLM(String(v.current_value || v.actual || '').slice(0, 200))}
  static_explanation: ${escapeForLLM(String(v.explanation || '').slice(0, 300))}
  code_snippet: ${escapeForLLM(snippet)}`;
    }).join('\n');

    return `You are Zaxion's governance explainer. The deterministic engine already decided: ${decision.decision}.
Do NOT change severity, invent violations, or override the verdict. Only explain what was detected in plain English for developers.

PR context:
- Changed files: ${prContext.totalChanges || prContext.files?.length || 'unknown'}
- Base branch: ${escapeForLLM(prContext.metadata?.base_branch || 'main')}

Violations:
${violationLines}

Output ONLY JSON:
{
  "decision_summary": "2-4 sentences why this PR was ${decision.decision}",
  "developer_next_steps": ["step 1", "step 2"],
  "violations": [
    {
      "rule_id": "string",
      "file": "string",
      "line": number or null,
      "explanation": "specific why for this file/line",
      "fix_steps": ["actionable fix"]
    }
  ]
}`;
  }

  _snippetFor(violation, prContext) {
    const files = prContext.files || [];
    const file = files.find((f) => (f.path || f.filename) === violation.file);
    const content = file?.content || violation.code || '';
    if (!content || typeof content !== 'string') return '';
    const lines = content.split('\n');
    const lineNum = violation.line || 1;
    const start = Math.max(0, lineNum - 3);
    return lines.slice(start, start + 6).join('\n').slice(0, 800);
  }

  _parseResponse(raw) {
    try {
      const text = typeof raw === 'string' ? raw : String(raw);
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(text.substring(start, end + 1));
      }
    } catch (e) {
      logger.warn('[ViolationExplainer] JSON parse failed:', e.message);
    }
    return { decision_summary: '', violations: [], developer_next_steps: [] };
  }

  _mergeExplanations(originalViolations, parsed) {
    const byKey = new Map();
    for (const pv of parsed.violations || []) {
      const key = `${pv.rule_id}|${pv.file}|${pv.line ?? ''}`;
      byKey.set(key, pv);
    }

    const merged = originalViolations.map((v) => {
      const key = `${v.rule_id}|${v.file}|${v.line ?? ''}`;
      const ai = byKey.get(key) || (parsed.violations || []).find(
        (p) => p.rule_id === v.rule_id && p.file === v.file
      );
      if (!ai) return { ...v };
      return {
        ...v,
        ai_explanation: ai.explanation || v.explanation,
        explanation: ai.explanation || v.explanation,
        ai_fix_steps: ai.fix_steps,
        remediation: ai.fix_steps?.length
          ? { ...(v.remediation || {}), steps: ai.fix_steps }
          : v.remediation,
      };
    });

    return {
      enriched: true,
      decision_summary: parsed.decision_summary || null,
      developer_next_steps: parsed.developer_next_steps || [],
      violations: merged,
    };
  }
}
