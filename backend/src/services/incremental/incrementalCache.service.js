/**
 * Namespaced incremental cache layers (in-memory v1; Redis-ready keys).
 */
import { astCache } from '../../utils/lruCache.js';

const CACHE_VERSION = 'incr-v1';

export class IncrementalCacheService {
  constructor() {
    this.parseCache = astCache;
    this.nodeFactCache = new Map();
    this.deepAstCache = new Map();
    this.policyEvalCache = new Map();
  }

  parseKey({ parser_engine, parser_version, language, file_hash }) {
    return `parse:${CACHE_VERSION}:${parser_engine}:${parser_version}:${language}:${file_hash}`;
  }

  nodeFactsKey({ policy_schema_version, node_id, subtree_hash }) {
    return `nodefacts:${CACHE_VERSION}:${policy_schema_version}:${node_id}:${subtree_hash}`;
  }

  getParse(key) {
    return this.parseCache.get(key);
  }

  setParse(key, value) {
    this.parseCache.set(key, value);
  }

  getNodeFacts(key) {
    return this.nodeFactCache.get(key);
  }

  setNodeFacts(key, value) {
    this.nodeFactCache.set(key, value);
  }

  getDeepAst(key) {
    return this.deepAstCache.get(key);
  }

  setDeepAst(key, value) {
    this.deepAstCache.set(key, value);
  }

  getPolicyEval(key) {
    return this.policyEvalCache.get(key);
  }

  setPolicyEval(key, value) {
    this.policyEvalCache.set(key, value);
  }

  stats() {
    return {
      node_fact_entries: this.nodeFactCache.size,
      deep_ast_entries: this.deepAstCache.size,
      policy_eval_entries: this.policyEvalCache.size,
    };
  }
}

export const incrementalCache = new IncrementalCacheService();
