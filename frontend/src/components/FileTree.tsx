import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen, 
  Search,
  CheckSquare,
  Square,
  MinusSquare
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  sha?: string;
  size?: number;
  children?: FileNode[];
}

interface FileTreeProps {
  data: FileNode[];
  selectedFiles: Set<string>;
  onSelectionChange: (newSelection: Set<string>) => void;
  repositoryName?: string;
  showIgnored?: boolean;
  onToggleShowIgnored?: () => void;
  expandedFolders?: Set<string>;
  onToggleFolder?: (path: string) => void;
  onSetExpandedFolders?: (paths: Set<string>) => void;
}

// Helper to flatten the tree based on expanded folders
const flattenTree = (
  nodes: FileNode[], 
  expandedFolders: Set<string>, 
  level: number = 0, 
  visibleNodes: FlattenedNode[] = []
): FlattenedNode[] => {
  nodes.forEach(node => {
    visibleNodes.push({ ...node, level });
    if (node.type === 'folder' && expandedFolders.has(node.path) && node.children) {
      flattenTree(node.children, expandedFolders, level + 1, visibleNodes);
    }
  });
  return visibleNodes;
};

interface FlattenedNode extends FileNode {
  level: number;
}

// Helper to get all file paths under a node (recursive)
const getAllFilePaths = (node: FileNode): string[] => {
  let paths: string[] = [];
  if (node.type === 'file') {
    paths.push(node.path);
  } else if (node.children) {
    node.children.forEach(child => {
      paths = [...paths, ...getAllFilePaths(child)];
    });
  }
  return paths;
};

export const FileTree: React.FC<FileTreeProps> = ({ 
  data, 
  selectedFiles, 
  onSelectionChange,
  repositoryName = "Repository",
  showIgnored,
  onToggleShowIgnored,
  expandedFolders: expandedFoldersProp,
  onToggleFolder: onToggleFolderProp,
  onSetExpandedFolders: onSetExpandedFoldersProp
}) => {
  const [internalExpandedFolders, setInternalExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const isControlled = expandedFoldersProp !== undefined;
  const expandedFolders = isControlled ? expandedFoldersProp : internalExpandedFolders;

  const handleSetExpandedFolders = useCallback((newSet: Set<string>) => {
    if (isControlled && onSetExpandedFoldersProp) {
      onSetExpandedFoldersProp(newSet);
    } else if (!isControlled) {
      setInternalExpandedFolders(newSet);
    }
  }, [isControlled, onSetExpandedFoldersProp]);

  const toggleFolder = useCallback((path: string) => {
    if (isControlled && onToggleFolderProp) {
      onToggleFolderProp(path);
    } else if (!isControlled) {
      const newExpanded = new Set(internalExpandedFolders);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      setInternalExpandedFolders(newExpanded);
    }
  }, [isControlled, onToggleFolderProp, internalExpandedFolders]);

  // Initial expansion: expand first level by default or just root
  // ONLY if not controlled. If controlled, parent handles initialization/persistence.
  useEffect(() => {
    if (isControlled) return;

    const initialExpanded = new Set<string>();
    // Maybe expand root folders?
    data.forEach(node => {
      if (node.type === 'folder') initialExpanded.add(node.path);
    });
    setInternalExpandedFolders(initialExpanded);
  }, [data, isControlled]);


  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    const filterNode = (node: FileNode): FileNode | null => {
      if (node.type === 'file') {
        return node.name.toLowerCase().includes(searchQuery.toLowerCase()) ? node : null;
      }
      
      // If folder matches, return it with all children? Or just filter children?
      // Usually, if folder matches, we show it. If children match, we show folder.
      const matchesFolder = node.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (node.children) {
        const filteredChildren = node.children
          .map(filterNode)
          .filter((n): n is FileNode => n !== null);
        
        if (filteredChildren.length > 0 || matchesFolder) {
          return { ...node, children: filteredChildren };
        }
      }
      
      return matchesFolder ? node : null;
    };

    return data
      .map(filterNode)
      .filter((n): n is FileNode => n !== null);
  }, [data, searchQuery]);

  // Auto-expand folders when searching
  useEffect(() => {
    if (searchQuery) {
      const allFolders = new Set<string>();
      const traverse = (nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'folder') {
            allFolders.add(node.path);
            if (node.children) traverse(node.children);
          }
        });
      };
      traverse(filteredData);
      handleSetExpandedFolders(allFolders);
    }
  }, [searchQuery, filteredData, handleSetExpandedFolders]);

  const flattenedNodes = useMemo(() => {
    return flattenTree(filteredData, expandedFolders);
  }, [filteredData, expandedFolders]);

  const handleNodeSelect = useCallback((node: FileNode) => {
    const newSelection = new Set(selectedFiles);
    
    if (node.type === 'file') {
      if (newSelection.has(node.path)) {
        newSelection.delete(node.path);
      } else {
        newSelection.add(node.path);
      }
    } else {
      // Folder selection: select all or deselect all
      const descendantPaths = getAllFilePaths(node);
      const allSelected = descendantPaths.every(path => selectedFiles.has(path));
      
      if (allSelected) {
        descendantPaths.forEach(path => newSelection.delete(path));
      } else {
        descendantPaths.forEach(path => newSelection.add(path));
      }
    }
    
    onSelectionChange(newSelection);
  }, [selectedFiles, onSelectionChange]);

  const handleSelectAll = () => {
    const allPaths = filteredData.flatMap(getAllFilePaths);
    onSelectionChange(new Set(allPaths));
  };

  const handleClearAll = () => {
    onSelectionChange(new Set());
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const node = flattenedNodes[index];
    const isExpanded = expandedFolders.has(node.path);
    
    // Determine selection state
    let isSelected = false;
    let isIndeterminate = false;

    if (node.type === 'file') {
      isSelected = selectedFiles.has(node.path);
    } else {
      const descendantPaths = getAllFilePaths(node);
      if (descendantPaths.length > 0) {
        const selectedCount = descendantPaths.filter(path => selectedFiles.has(path)).length;
        isSelected = selectedCount === descendantPaths.length;
        isIndeterminate = selectedCount > 0 && selectedCount < descendantPaths.length;
      }
    }

    return (
      <div style={style} className="flex items-center hover:bg-accent/50 rounded-sm pr-2">
        <div 
          style={{ paddingLeft: `${node.level * 20}px` }} 
          className="flex items-center flex-1 min-w-0 py-1"
        >
          {/* Expand/Collapse Toggle */}
          <div className="w-6 flex justify-center shrink-0">
            {node.type === 'folder' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(node.path);
                }}
                className="p-0.5 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
          </div>

          {/* Checkbox */}
          <div 
            className="mr-2 cursor-pointer"
            onClick={() => handleNodeSelect(node)}
          >
            {isIndeterminate ? (
              <MinusSquare className="h-4 w-4 text-primary" />
            ) : isSelected ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Icon */}
          <div className="mr-2 text-muted-foreground">
            {node.type === 'folder' ? (
              isExpanded ? <FolderOpen className="h-4 w-4 text-blue-400" /> : <Folder className="h-4 w-4 text-blue-400" />
            ) : (
              <File className="h-4 w-4" />
            )}
          </div>

          {/* Name */}
          <span 
            className={cn(
              "truncate text-sm cursor-pointer select-none", 
              isSelected && "font-medium text-primary"
            )}
            onClick={() => handleNodeSelect(node)}
          >
            {node.name}
          </span>
          
          {node.type === 'file' && node.size && (
             <span className="ml-auto text-xs text-muted-foreground mr-2">
               {(node.size / 1024).toFixed(1)} KB
             </span>
          )}
        </div>
      </div>
    );
  };

  const allFilesCount = useMemo(() => {
    return filteredData.reduce((acc, node) => acc + getAllFilePaths(node).length, 0);
  }, [filteredData]);

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Folder className="h-5 w-5" />
            {repositoryName}
          </CardTitle>
          <div className="flex gap-2 items-center">
            {onToggleShowIgnored && (
               <div className="flex items-center space-x-2 mr-2">
                 <Checkbox 
                    id="show-ignored" 
                    checked={showIgnored} 
                    onCheckedChange={() => onToggleShowIgnored()}
                 />
                 <label 
                   htmlFor="show-ignored" 
                   className="text-xs text-muted-foreground cursor-pointer select-none"
                 >
                   Ignored
                 </label>
               </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSelectAll}
              disabled={selectedFiles.size === allFilesCount && allFilesCount > 0}
            >
              Select All
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAll}
              disabled={selectedFiles.size === 0}
            >
              Clear All
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{selectedFiles.size} selected</Badge>
          <span>of {allFilesCount} files</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {flattenedNodes.length > 0 ? (
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                itemCount={flattenedNodes.length}
                itemSize={32}
                width={width}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No files found
          </div>
        )}
      </CardContent>
    </Card>
  );
};
