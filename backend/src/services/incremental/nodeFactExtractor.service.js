/**
 * Layer 1: shallow structural facts from parsed trees (Tree-sitter / Babel bridge).
 */
import traverse from '@babel/traverse';
import { classifyFileKind, detectLanguageFromPath } from './fileKindClassifier.service.js';
import { incrementalCache } from './incrementalCache.service.js';
import { incrementalMetrics } from './incrementalMetrics.service.js';

const POLICY_SCHEMA_VERSION = 'v1';

/**
 * @param {object} parseResult from treeSitterParser
 * @param {string} filePath
 * @param {string} content
 */
export function extractShallowFacts(parseResult, filePath, content) {
  const facts = {
    file_path: filePath,
    file_kind: classifyFileKind(filePath),
    language: detectLanguageFromPath(filePath),
    call_sites: [],
    imports: [],
    exports: [],
    semantic_tags: [],
  };

  if (!parseResult?.success || !parseResult.root) {
    return facts;
  }

  if (parseResult.root.shallow && parseResult.language === 'python') {
    for (const tag of parseResult.root.tags || []) {
      facts.semantic_tags.push(tag);
    }
    facts.semantic_tags = [...new Set(facts.semantic_tags)];
    return facts;
  }

  try {
    traverse.default(parseResult.root, {
      CallExpression(path) {
        const callee = path.node.callee;
        let name = null;
        if (callee.type === 'MemberExpression' && callee.object?.name === 'console') {
          name = `console.${callee.property?.name || 'log'}`;
        } else if (callee.type === 'Identifier') {
          name = callee.name;
        }
        if (name) {
          facts.call_sites.push({
            name,
            line: path.node.loc?.start?.line,
            column: path.node.loc?.start?.column,
          });
          if (name.startsWith('console.')) {
            facts.semantic_tags.push('console_log');
          }
          if (/^(exec|spawn|execSync|child_process)/.test(name)) {
            facts.semantic_tags.push('command_exec_candidate');
          }
        }
      },
      ImportDeclaration(path) {
        if (path.node.source?.value) {
          facts.imports.push(path.node.source.value);
        }
      },
      ExportNamedDeclaration() {
        facts.exports.push('named');
      },
      ExportDefaultDeclaration() {
        facts.exports.push('default');
      },
    });
  } catch {
    incrementalMetrics.recordFallback('shallow_fact_extract');
  }

  facts.semantic_tags = [...new Set(facts.semantic_tags)];
  return facts;
}

/**
 * @param {string} nodeId
 * @param {string} subtreeHash
 * @param {object} facts
 */
export function cacheNodeFacts(nodeId, subtreeHash, facts) {
  const key = incrementalCache.nodeFactsKey({
    policy_schema_version: POLICY_SCHEMA_VERSION,
    node_id: nodeId,
    subtree_hash: subtreeHash,
  });
  const existing = incrementalCache.getNodeFacts(key);
  if (existing) {
    incrementalMetrics.recordCacheHit('node_facts', true);
    return existing;
  }
  incrementalMetrics.recordCacheHit('node_facts', false);
  incrementalCache.setNodeFacts(key, facts);
  return facts;
}

export class NodeFactExtractorService {
  extract(parseResult, filePath, content) {
    return extractShallowFacts(parseResult, filePath, content);
  }
}
