/**
 * Shared incremental architecture types and constants.
 */

/** @typedef {'source'|'test'|'manifest'|'workflow'|'lockfile'|'infrastructure'|'unknown'} FileKind */
/** @typedef {'shallow'|'selective_deep'|'full_fallback'|'legacy'|'skip'} RoutingPath */
/** @typedef {'legacy'|'hybrid'|'incremental'} AnalysisMode */

export const FILE_KINDS = Object.freeze([
  'source',
  'test',
  'manifest',
  'workflow',
  'lockfile',
  'infrastructure',
  'unknown',
]);

export const ROUTING_PATHS = Object.freeze([
  'shallow',
  'selective_deep',
  'full_fallback',
  'legacy',
  'skip',
]);

export const INCREMENTAL_ENGINE_VERSION = 'incr-v1';
