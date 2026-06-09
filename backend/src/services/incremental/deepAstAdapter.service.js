/**
 * Layer 2: selective deep AST validation (JS/TS via Babel; Python fallback-compatible).
 */
import traverse from '@babel/traverse';
import { incrementalFlags } from './incrementalFeatureFlags.service.js';
import { incrementalCache } from './incrementalCache.service.js';
import { incrementalMetrics } from './incrementalMetrics.service.js';

const DEEP_ENGINE_VERSION = 'babel-deep-v1';
const BLOCK_CONFIDENCE_THRESHOLD = 0.85;

/**
 * Deep-validate a shallow security/console candidate.
 * @param {object} params
 * @param {object} params.parseResult
 * @param {string} params.filePath
 * @param {string} params.policyType
 * @param {object} params.shallowFacts
 */
export function validateDeep({ parseResult, filePath, policyType, shallowFacts }) {
  if (!incrementalFlags.isDeepAstEnabled()) {
    return { use_legacy: true, confidence: 0.5 };
  }

  const cacheKey = `deepast:${DEEP_ENGINE_VERSION}:${filePath}:${policyType}:${shallowFacts?.semantic_tags?.join(',')}`;
  const cached = incrementalCache.getDeepAst(cacheKey);
  if (cached) {
    incrementalMetrics.recordCacheHit('deep_ast', true);
    return cached;
  }
  incrementalMetrics.recordCacheHit('deep_ast', false);

  if (!parseResult?.success || !parseResult.root) {
    incrementalMetrics.recordFallback('deep_ast_parse');
    return { use_legacy: true, confidence: 0.5 };
  }

  const language = parseResult.language;
  if (language !== 'javascript' && language !== 'typescript') {
    return { use_legacy: true, confidence: 0.5, reason: 'unsupported_language' };
  }

  let confidence = 0.9;
  let confirmedViolations = [];
  const tags = shallowFacts?.semantic_tags || [];

  if (policyType === 'code_quality' || policyType === 'security_patterns') {
    if (tags.includes('console_log')) {
      const testFile =
        /\.(test|spec)\./i.test(filePath) ||
        /\/(__tests__|tests?)\//i.test(filePath);
      if (testFile) {
        confidence = 0.3;
      } else {
        confirmedViolations.push({ tag: 'console_log', message: 'Console call in production path' });
      }
    }
  }

  if (policyType === 'security_patterns' && tags.includes('command_exec_candidate')) {
    traverse.default(parseResult.root, {
      CallExpression(path) {
        const src = path.get('arguments')[0];
        if (src?.isStringLiteral() && /rm\s+-rf|curl\s+\|/i.test(src.node.value)) {
          confirmedViolations.push({ tag: 'command_exec', message: 'Risky shell invocation' });
          confidence = 0.95;
        }
      },
    });
  }

  const result = {
    use_legacy: false,
    confidence,
    confirmed_violations: confirmedViolations,
    recommend_verdict:
      confirmedViolations.length > 0 && confidence >= BLOCK_CONFIDENCE_THRESHOLD
        ? 'BLOCK'
        : confirmedViolations.length > 0
          ? 'OBSERVE'
          : 'PASS',
  };

  incrementalCache.setDeepAst(cacheKey, result);
  return result;
}

export class DeepAstAdapterService {
  validate(params) {
    return validateDeep(params);
  }
}
