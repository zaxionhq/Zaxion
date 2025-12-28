import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { 
  ChevronRight, 
  ChevronDown, 
  File as FileIcon, 
  Folder, 
  FolderOpen, 
  GitBranch,
  FileCode,
  FileJson,
  Settings,
  Book,
  Check,
  ChevronsUpDown,
  Search,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { GitHubRepo, GitHubBranch } from '@/hooks/useTestGeneration';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  sha?: string;
  size?: number;
  children?: FileNode[];
  // Mock git status for visualization
  gitStatus?: 'modified' | 'new' | 'none';
}

interface FileTreeProps {
  data: FileNode[];
  selectedFiles: Set<string>;
  onSelectionChange: (newSelection: Set<string>) => void;
  // Repository Context
  repos?: GitHubRepo[];
  selectedRepo?: GitHubRepo | null;
  onRepoChange?: (repo: GitHubRepo) => void;
  // Branch Context
  branches?: GitHubBranch[];
  selectedBranch?: string;
  onBranchChange?: (branch: string) => void;
  
  isLoading?: boolean;
  
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

// Mock function to assign random git status if not present
const getMockGitStatus = (name: string): 'modified' | 'new' | 'none' => {
  if (name.endsWith('.ts') || name.endsWith('.tsx')) {
    // Randomly assign modified status to some TS files
    return Math.random() > 0.7 ? 'modified' : 'none';
  }
  if (name.includes('config')) {
    return 'modified';
  }
  if (name.startsWith('new')) {
    return 'new';
  }
  return 'none';
};

export const FileTree: React.FC<FileTreeProps> = ({ 
  data, 
  selectedFiles, 
  onSelectionChange,
  repos = [],
  selectedRepo,
  onRepoChange,
  branches = [],
  selectedBranch,
  onBranchChange,
  isLoading = false,
  expandedFolders: expandedFoldersProp,
  onToggleFolder: onToggleFolderProp,
  onSetExpandedFolders: onSetExpandedFoldersProp
}) => {
  const [internalExpandedFolders, setInternalExpandedFolders] = useState<Set<string>>(new Set());
  const [openRepo, setOpenRepo] = useState(false);
  const [openBranch, setOpenBranch] = useState(false);
  
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

  // Initial expansion
  useEffect(() => {
    if (isControlled) return;
    const initialExpanded = new Set<string>();
    data.forEach(node => {
      if (node.type === 'folder') initialExpanded.add(node.path);
    });
    setInternalExpandedFolders(initialExpanded);
  }, [data, isControlled]);

  const flattenedNodes = useMemo(() => {
    // Inject mock git status if needed (in a real app this would come from props)
    const nodesWithStatus = data.map(node => ({
      ...node,
      gitStatus: node.gitStatus || getMockGitStatus(node.name)
    }));
    return flattenTree(nodesWithStatus, expandedFolders);
  }, [data, expandedFolders]);

  const handleNodeSelect = useCallback((node: FileNode) => {
    const newSelection = new Set(selectedFiles);
    
    if (node.type === 'file') {
      if (newSelection.has(node.path)) {
        newSelection.delete(node.path);
      } else {
        // Single select behavior for IDE style usually, but keeping multi-select capability
        // For strict IDE feel, maybe clear others? But requirement says "Active File", implies single active.
        // However, the app logic seems to support multiple selections for test generation.
        // I will stick to current behavior but style the active one.
        // If we want single select visual, we check if it's the *last* selected or similar.
        // Let's keep it simple: toggle selection.
        newSelection.add(node.path);
      }
    } else {
      // Folder selection logic
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

  const handleCollapseAll = () => {
    handleSetExpandedFolders(new Set());
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const node = flattenedNodes[index];
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFiles.has(node.path);
    
    // File Icons Logic
    const getFileIcon = () => {
      if (node.type === 'folder') {
        return isExpanded 
          ? <FolderOpen className="h-4 w-4 text-blue-500 fill-blue-500/20" /> 
          : <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />;
      }
      if (node.name.endsWith('.ts')) return <FileCode className="h-4 w-4 text-blue-400" />;
      if (node.name.endsWith('.tsx')) return <FileCode className="h-4 w-4 text-yellow-400" />;
      if (node.name.endsWith('.json')) return <FileJson className="h-4 w-4 text-yellow-300" />;
      if (node.name.includes('config')) return <Settings className="h-4 w-4 text-gray-400" />;
      return <FileIcon className="h-4 w-4 text-gray-400" />;
    };

    // Git Status Styling
    let textColorClass = "text-zinc-300";
    let statusBadge = null;

    if (node.gitStatus === 'modified') {
      textColorClass = "text-[#cca700]";
      statusBadge = <span className="ml-auto text-[10px] font-bold text-[#cca700] mr-2">M</span>;
    } else if (node.gitStatus === 'new') {
      textColorClass = "text-[#58a6ff]";
      statusBadge = <span className="ml-auto text-[10px] font-bold text-[#58a6ff] mr-2">U</span>;
    }

    return (
      <div 
        style={style} 
        className={cn(
          "flex items-center group cursor-pointer select-none",
          isSelected ? "bg-[#37373d]" : "hover:bg-[#2a2d2e]"
        )}
        onClick={() => node.type === 'folder' ? toggleFolder(node.path) : handleNodeSelect(node)}
      >
        <div 
          style={{ paddingLeft: `${node.level * 10 + 10}px` }} 
          className="flex items-center w-full h-full"
        >
          {/* Chevron for Folders */}
          <div className="w-4 flex justify-center shrink-0 mr-1">
            {node.type === 'folder' && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                 {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                )}
              </div>
            )}
          </div>

          {/* Icon */}
          <div className="mr-1.5 shrink-0">
            {getFileIcon()}
          </div>

          {/* Name */}
          <span className={cn("truncate text-[13px]", textColorClass)}>
            {node.name}
          </span>
          
          {/* Git Status Badge */}
          {statusBadge}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#18181b] text-zinc-300 select-none border-r border-[#2b2d31]">
      {/* Header Section */}
      <div className="flex flex-col px-2 py-3 border-b border-[#2b2d31] gap-3">
        {/* Row 1: Repository Context */}
        <Popover open={openRepo} onOpenChange={setOpenRepo}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              role="combobox"
              aria-expanded={openRepo}
              className="w-full justify-between px-2 h-8 text-sm font-semibold hover:bg-[#2b2d31] hover:text-white"
            >
              <div className="flex items-center gap-2 truncate">
                <Book className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="truncate">
                  {selectedRepo ? `${selectedRepo.owner.login}/${selectedRepo.name}` : "Select Repository"}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0 ml-2" align="start">
            <Command>
              <CommandInput placeholder="Search repository..." />
              <CommandList>
                <CommandEmpty>No repository found.</CommandEmpty>
                <CommandGroup>
                  {repos.map((repo) => (
                    <CommandItem
                      key={repo.id}
                      value={`${repo.owner.login}/${repo.name}`}
                      onSelect={() => {
                        if (onRepoChange) onRepoChange(repo);
                        setOpenRepo(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedRepo?.id === repo.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {repo.owner.login}/{repo.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Row 2: Branch Context */}
        <Popover open={openBranch} onOpenChange={setOpenBranch}>
          <PopoverTrigger asChild>
             <div className="flex items-center gap-2 px-2 cursor-pointer group" onClick={() => !isLoading && setOpenBranch(true)}>
                <GitBranch className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300" />
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors truncate flex-1">
                   {isLoading ? "Loading..." : (selectedBranch || "Select Branch")}
                </span>
                {isLoading && <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />}
             </div>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0 ml-2" align="start">
            <Command>
              <CommandInput placeholder="Search branch..." />
              <CommandList>
                <CommandEmpty>No branch found.</CommandEmpty>
                <CommandGroup>
                  {branches.map((branch) => (
                    <CommandItem
                      key={branch.name}
                      value={branch.name}
                      onSelect={() => {
                        if (onBranchChange) onBranchChange(branch.name);
                        setOpenBranch(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedBranch === branch.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {branch.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-hidden outline-none focus:outline-none focus:ring-1 focus:ring-[#007fd4]" tabIndex={0}>
        {isLoading ? (
           <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
              <span className="text-xs">Loading files...</span>
           </div>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                itemCount={flattenedNodes.length}
                itemSize={22} // Compaction: 22px height
                width={width}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        )}
      </div>
    </div>
  );
};
