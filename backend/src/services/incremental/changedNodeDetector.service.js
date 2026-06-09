/**
 * Detect changed subtrees via Merkle hash comparison between snapshots.
 */
import { sha256 } from './merkleHash.service.js';

/**
 * @param {string} content
 */
export function fileContentHash(content) {
  return sha256(content || '');
}

/**
 * @param {object|null} previousIncremental metadata.incremental from prior snapshot
 * @param {object} currentIncremental
 * @returns {{ changed_files: string[], unchanged_files: string[] }}
 */
export function detectChangedFiles(previousIncremental, currentIncremental) {
  const prevByPath = new Map();
  for (const f of previousIncremental?.files || []) {
    if (f.file_path) prevByPath.set(f.file_path, f);
  }

  const changed_files = [];
  const unchanged_files = [];

  for (const f of currentIncremental?.files || []) {
    const prev = prevByPath.get(f.file_path);
    if (!prev || prev.file_hash !== f.file_hash || prev.root_subtree_hash !== f.root_subtree_hash) {
      changed_files.push(f.file_path);
    } else {
      unchanged_files.push(f.file_path);
    }
  }

  return { changed_files, unchanged_files };
}

export class ChangedNodeDetectorService {
  detect(previousIncremental, currentIncremental) {
    return detectChangedFiles(previousIncremental, currentIncremental);
  }
}
