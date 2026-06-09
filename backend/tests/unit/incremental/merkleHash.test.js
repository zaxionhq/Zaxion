import { describe, it, expect } from '@jest/globals';
import { buildMerkleMap, sha256 } from '../../../src/services/incremental/merkleHash.service.js';

describe('merkleHash', () => {
  it('sha256 is deterministic', () => {
    expect(sha256('hello')).toBe(sha256('hello'));
  });

  it('buildMerkleMap produces stable root hash', () => {
    const nodes = [
      {
        node_id: 'root',
        parent_node_id: null,
        node_kind: 'Program',
        normalized_text_hash: sha256('code'),
        start_byte: 0,
        end_byte: 4,
      },
      {
        node_id: 'child',
        parent_node_id: 'root',
        node_kind: 'Identifier',
        normalized_text_hash: sha256('x'),
        start_byte: 0,
        end_byte: 1,
      },
    ];
    const a = buildMerkleMap(nodes);
    const b = buildMerkleMap(nodes);
    expect(a.root_subtree_hash).toBe(b.root_subtree_hash);
    expect(a.root_subtree_hash).toBeTruthy();
  });
});
