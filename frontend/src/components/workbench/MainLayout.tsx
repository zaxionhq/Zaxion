import React from 'react';
import { ArrowLeft, ChevronRight, GitPullRequest } from 'lucide-react';
import { Button } from '../ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { FileTree, FileNode } from '../FileTree';
import { TerminalPanel } from './TerminalPanel';
import { EditorPanel } from './EditorPanel';
import { CopilotPanel } from './CopilotPanel';
import { GitHubRepo, GitHubBranch } from '@/hooks/useTestGeneration';
import { TestRunnerPanel } from './TestRunnerPanel';
import { VerificationEditor } from './VerificationEditor';
import { useReviewStore } from '@/stores/useReviewStore';
import { socketEmitter } from '@/hooks/useSocket';

interface MainLayoutProps {
  // FileTree Props
  files: FileNode[];
  selectedFiles: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  
  // Repo & Branch Context
  repos?: GitHubRepo[];
  selectedRepo?: GitHubRepo | null;
  onRepoChange?: (repo: GitHubRepo) => void;
  branches?: GitHubBranch[];
  selectedBranch?: string;
  onBranchChange?: (branch: string) => void;

  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onSetExpandedFolders: (paths: Set<string>) => void;

  // Editor Props
  activeFile?: string;
  activeFileContent?: string;
  editedCode?: string;
  onCodeChange?: (content: string | undefined) => void;
  onSave?: () => void;
  
  // Controls
  onRunTests?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onBack?: () => void;
  onCreatePR?: () => Promise<void>;
  
  // General
  isLoading?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  files,
  selectedFiles,
  onSelectionChange,
  repos,
  selectedRepo,
  onRepoChange,
  branches,
  selectedBranch,
  onBranchChange,
  expandedFolders,
  onToggleFolder,
  onSetExpandedFolders,
  activeFile,
  activeFileContent,
  editedCode,
  onCodeChange,
  onSave,
  onRunTests,
  onToggleChat,
  isChatOpen,
  onBack,
  onCreatePR,
  isLoading
}) => {
  const { isReviewing } = useReviewStore();

  const handleRunTests = () => {
    // Simulate running tests via socket
    socketEmitter.emit('@runner/output', '\u001b[36mRunning tests...\u001b[0m');
    setTimeout(() => {
        socketEmitter.emit('@runner/output', 'Test Suite 1: \u001b[32mPASS\u001b[0m');
        socketEmitter.emit('@runner/output', 'Test Suite 2: \u001b[32mPASS\u001b[0m');
        socketEmitter.emit('@runner/output', 'Done.');
    }, 1500);
  };

  const handleStageForPR = () => {
    alert('Staged for PR!');
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-zinc-100 overflow-hidden flex flex-col">
      {/* Top Bar / Menu */}
      <div className="h-10 border-b border-[#2b2d31] bg-[#18181b] flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          )}
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <span className="text-zinc-500">Workspace</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-200">{activeFile || 'No file selected'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onCreatePR && (
            <Button 
              size="sm" 
              variant="default" 
              className="h-7 text-xs gap-1.5 bg-primary hover:bg-primary/90"
              onClick={onCreatePR}
            >
              <GitPullRequest className="h-3.5 w-3.5" />
              Create PR
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          
          {/* LEFT SIDEBAR: File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-[#18181b] border-r border-[#2b2d31]">
            <FileTree 
              data={files}
              selectedFiles={selectedFiles}
              onSelectionChange={onSelectionChange}
              repos={repos}
              selectedRepo={selectedRepo}
              onRepoChange={onRepoChange}
              branches={branches}
              selectedBranch={selectedBranch}
              onBranchChange={onBranchChange}
              isLoading={isLoading}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onSetExpandedFolders={onSetExpandedFolders}
            />
          </ResizablePanel>
          
          <ResizableHandle className="bg-[#2b2d31] w-[1px]" />

          {/* CENTER: Editor & Terminal */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* EDITOR */}
              <ResizablePanel defaultSize={70} minSize={30}>
                 {isReviewing ? (
                    <VerificationEditor 
                        onRunTests={handleRunTests}
                        onStageForPR={handleStageForPR}
                    />
                 ) : (
                    <EditorPanel 
                      fileName={activeFile ? activeFile.split('/').pop() : undefined}
                      filePath={activeFile}
                      code={activeFileContent}
                      onCodeChange={onCodeChange}
                      isLoading={isLoading}
                    />
                 )}
              </ResizablePanel>
              
              <ResizableHandle className="bg-[#2b2d31] h-[1px]" />
              
              {/* TERMINAL */}
              <ResizablePanel defaultSize={30} minSize={10}>
                {isReviewing ? <TestRunnerPanel /> : <TerminalPanel />}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          <ResizableHandle className="bg-[#2b2d31] w-[1px]" />

          {/* RIGHT SIDEBAR: Copilot / AI */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
            <CopilotPanel activeFile={activeFile} />
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
      
      {/* Status Bar */}
      <div className="h-6 bg-[#007fd4] text-white flex items-center justify-between px-3 text-[11px] select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 font-medium">
            <span>main*</span>
          </div>
          <div className="flex items-center gap-1">
             <span>0</span>
             <span>↓</span>
             <span>0</span>
             <span>↑</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <span>Ln 12, Col 45</span>
           <span>UTF-8</span>
           <span>TypeScript React</span>
           <span>Prettier</span>
           <span className="ml-2">🔔</span>
        </div>
      </div>
    </div>
  );
};
