/**
 * Converts parser nodes to canonical incremental node records.
 */
import { sha256, stableNodeId } from './merkleHash.service.js';

/**
 * Normalize text for hashing (deterministic v1).
 * @param {string} text
 */
export function normalizeTextForHash(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * @param {object} params
 * @param {string} params.file_path
 * @param {string} params.node_kind
 * @param {number} params.start_byte
 * @param {number} params.end_byte
 * @param {number} params.start_line
 * @param {number} params.end_line
 * @param {string} params.raw_text
 * @param {string|null} [params.parent_node_id]
 */
export function toCanonicalNode({
  file_path,
  node_kind,
  start_byte,
  end_byte,
  start_line,
  end_line,
  raw_text,
  parent_node_id = null,
}) {
  const text_hash = sha256(raw_text || '');
  const normalized_text_hash = sha256(normalizeTextForHash(raw_text || ''));
  const node_id = stableNodeId({
    file_path,
    start_byte,
    end_byte,
    node_kind,
    normalized_text_hash,
  });

  return {
    node_id,
    file_path,
    parent_node_id,
    node_kind,
    start_byte,
    end_byte,
    start_line,
    end_line,
    text_hash,
    normalized_text_hash,
    child_count: 0,
    depth: 0,
    semantic_tags: [],
  };
}

export class NodeCanonicalizerService {
  normalizeText(text) {
    return normalizeTextForHash(text);
  }

  toCanonicalNode(params) {
    return toCanonicalNode(params);
  }
}
