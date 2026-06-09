/**
 * Deterministic subtree Merkle hashes for incremental node cache.
 */
import crypto from 'crypto';

/**
 * @param {string} input
 */
export function sha256(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * @param {object} node
 * @param {string} node.node_kind
 * @param {string} node.normalized_text_hash
 * @param {number} node.start_byte
 * @param {number} node.end_byte
 * @param {string[]} childHashes sorted child subtree hashes
 */
export function computeSubtreeHash(node, childHashes = []) {
  const parts = [
    node.node_kind || '',
    node.normalized_text_hash || '',
    String(node.start_byte ?? 0),
    String(node.end_byte ?? 0),
    ...[...childHashes].sort(),
  ];
  return sha256(parts.join('|'));
}

/**
 * @param {object} params
 */
export function stableNodeId({ file_path, start_byte, end_byte, node_kind, normalized_text_hash }) {
  return sha256(
    `${file_path}:${start_byte}:${end_byte}:${node_kind}:${normalized_text_hash}`
  );
}

/**
 * Build merkle map from flat node list (parent_id references).
 * @param {Array<{ node_id: string, parent_node_id?: string|null, node_kind: string, normalized_text_hash: string, start_byte: number, end_byte: number }>} nodes
 */
export function buildMerkleMap(nodes) {
  const byId = new Map(nodes.map((n) => [n.node_id, n]));
  const children = new Map();
  let rootId = null;

  for (const n of nodes) {
    if (!n.parent_node_id) {
      rootId = n.node_id;
    } else {
      const list = children.get(n.parent_node_id) || [];
      list.push(n.node_id);
      children.set(n.parent_node_id, list);
    }
  }

  const hashMemo = new Map();

  function hashOf(nodeId) {
    if (hashMemo.has(nodeId)) return hashMemo.get(nodeId);
    const node = byId.get(nodeId);
    if (!node) return sha256('missing');

    const childIds = children.get(nodeId) || [];
    const childHashes = childIds.map(hashOf);
    const h = computeSubtreeHash(node, childHashes);
    hashMemo.set(nodeId, h);
    return h;
  }

  const subtree_hashes_by_node = {};
  for (const n of nodes) {
    subtree_hashes_by_node[n.node_id] = hashOf(n.node_id);
  }

  return {
    root_node_id: rootId,
    root_subtree_hash: rootId ? hashOf(rootId) : null,
    subtree_hashes_by_node,
  };
}

export class MerkleHashService {
  computeSubtreeHash(node, childHashes) {
    return computeSubtreeHash(node, childHashes);
  }

  stableNodeId(params) {
    return stableNodeId(params);
  }

  buildMerkleMap(nodes) {
    return buildMerkleMap(nodes);
  }
}
