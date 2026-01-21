import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { X, FileCode, SplitSquareHorizontal, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EditorPanelProps {
  fileName?: string;
  filePath?: string;
  code?: string;
  language?: string;
  readOnly?: boolean;
  onCodeChange?: (value: string | undefined) => void;
  isLoading?: boolean;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  fileName = 'Untitled',
  filePath,
  code = '// Select a file to view its content',
  language = 'typescript',
  readOnly = false,
  onCodeChange,
  isLoading = false
}) => {
  const [tabs, setTabs] = useState([
    { name: fileName, active: true, path: filePath }
  ]);

  // Update tabs when file changes
  React.useEffect(() => {
    setTabs(prev => {
      const exists = prev.find(t => t.name === fileName);
      if (fileName && !exists) {
        return prev.map(t => ({ ...t, active: false })).concat({ name: fileName, active: true, path: filePath });
      } else if (fileName) {
        return prev.map(t => ({ ...t, active: t.name === fileName }));
      }
      return prev;
    });
  }, [fileName, filePath]);

  return (
    <div className="flex flex-col h-full bg-[#1f1f23] overflow-hidden">
      {/* Editor Tabs */}
      <div className="flex items-center bg-[#18181b] h-[35px] select-none">
        {tabs.map((tab, i) => (
          <div 
            key={i}
            className={cn(
              "flex items-center gap-2 px-3 h-full min-w-[120px] max-w-[200px] border-r border-[#2b2d31] cursor-pointer group",
              tab.active 
                ? "bg-[#1f1f23] border-t-2 border-t-blue-500 text-zinc-100" 
                : "bg-[#18181b] text-zinc-500 hover:bg-[#1f1f23]/50 italic"
            )}
          >
            <FileCode className={cn("h-3.5 w-3.5", tab.active ? "text-blue-400" : "text-zinc-500")} />
            <span className="text-[13px] truncate flex-1">{tab.name}</span>
            <X className={cn(
              "h-3.5 w-3.5 hover:bg-zinc-700 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
              tab.active && "opacity-100"
            )} />
          </div>
        ))}
        
        {/* Empty space actions */}
        <div className="flex-1 flex justify-end items-center pr-2 gap-1 h-full border-b border-[#2b2d31] bg-[#18181b]">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white">
            <SplitSquareHorizontal className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Breadcrumbs (Optional but nice for Cursor look) */}
      <div className="flex items-center px-4 h-[22px] bg-[#1f1f23] border-b border-[#2b2d31] text-[11px] text-zinc-500">
        <span>{filePath || fileName}</span>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
          </div>
        ) : (
          <Editor
            height="100%"
            language={language}
            value={code}
            theme="vs-dark"
            onChange={onCodeChange}
            options={{
              readOnly: readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 10, bottom: 10 },
              renderLineHighlight: 'all',
            }}
          />
        )}
      </div>
    </div>
  );
};
