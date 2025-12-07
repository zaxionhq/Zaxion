import { useState, useCallback } from 'react';
import { FileNode } from '@/components/FileTree';

export const useFileTreeState = () => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Function to clean up expanded folders that no longer exist in the new file tree
  const reconcileExpansion = useCallback((nodes: FileNode[]) => {
    setExpandedFolders(prev => {
      const next = new Set<string>();
      const availablePaths = new Set<string>();

      const traverse = (list: FileNode[]) => {
        list.forEach(node => {
          availablePaths.add(node.path);
          if (node.children) traverse(node.children);
        });
      };
      traverse(nodes);

      // Keep folders that still exist
      prev.forEach(path => {
        if (availablePaths.has(path)) {
          next.add(path);
        }
      });

      // If we have no expanded folders (e.g. initial load), expand root folders by default
      if (prev.size === 0) {
        nodes.forEach(node => {
          if (node.type === 'folder') next.add(node.path);
        });
      }

      return next;
    });
  }, []);

  const resetExpansion = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  return {
    expandedFolders,
    toggleFolder,
    reconcileExpansion,
    resetExpansion,
    setExpandedFolders
  };
};
