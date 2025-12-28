import React, { useEffect, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useReviewStore } from '@/stores/useReviewStore';
import { useReviewShortcuts } from '@/hooks/useReviewShortcuts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Save, MessageSquare } from 'lucide-react';
import type { editor } from 'monaco-editor';

interface VerificationEditorProps {
  onRunTests: () => void;
  onStageForPR: () => void;
}

export const VerificationEditor: React.FC<VerificationEditorProps> = ({ onRunTests, onStageForPR }) => {
  const { sourceFile, sourceFilePath, testFile, setTestFile, testResults } = useReviewStore();
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [monaco, setMonaco] = useState<Monaco | null>(null);

  // Hook up shortcuts
  useReviewShortcuts({
    editor,
    runTests: onRunTests,
    stageForPR: onStageForPR
  });

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    setEditor(editor);
    setMonaco(monaco);
  };

  // Handle Decorations (Green/Red Gutter)
  useEffect(() => {
    if (!editor || !monaco || testResults.length === 0) return;

    // This is a simplified example. In reality, we'd map line numbers from the test result to the editor.
    // For now, we'll just decorate the whole file or specific mocked lines if we had them.
    // Since we receive "PASS" or "FAIL" messages, we might not have line numbers unless we parse them deeper.
    // We'll simulate a decoration on line 1 if PASS, just to show we can.

    const decorations: editor.IModelDeltaDecoration[] = [];
    const hasFail = testResults.some(r => r.type === 'fail');
    const hasPass = testResults.some(r => r.type === 'pass');

    // Example decoration logic
    if (hasFail) {
      decorations.push({
        range: new monaco.Range(1, 1, 1, 1),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: 'myLineDecoration-fail',
          glyphMarginClassName: 'myGlyphMargin-fail'
        }
      });
    } else if (hasPass) {
      decorations.push({
        range: new monaco.Range(1, 1, 1, 1),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: 'myLineDecoration-pass',
          glyphMarginClassName: 'myGlyphMargin-pass'
        }
      });
    }
    
    // Apply decorations
    const collection = editor.createDecorationsCollection(decorations);
    
    // Clean up on unmount or change
    return () => {
      collection.clear();
    };
  }, [editor, monaco, testResults]);

  // Inject CSS for decorations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .myLineDecoration-pass { background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; }
      .myLineDecoration-fail { background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="h-10 bg-[#252526] border-b border-[#2b2d31] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-zinc-400 border-zinc-700 bg-[#1e1e1e]">Verification Mode</Badge>
          <span className="text-xs text-zinc-500">Cmd+Enter to Verify • Cmd+S to Stage</span>
        </div>
        <div className="flex items-center gap-2">
           <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={onRunTests}>
             <Play className="w-3 h-3" /> Run Tests
           </Button>
           <Button size="sm" variant="default" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700" onClick={onStageForPR}>
             <Save className="w-3 h-3" /> Stage
           </Button>
        </div>
      </div>

      {/* Dual Pane Editor */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          
          {/* Left Pane: Source (Read-Only) */}
          <ResizablePanel defaultSize={50} minSize={30} className="border-r border-[#2b2d31]">
            <div className="h-full flex flex-col">
               <div className="h-6 bg-[#1e1e1e] border-b border-[#2b2d31] flex items-center px-3 text-xs text-zinc-500 select-none">
                  {sourceFilePath || 'Source File'} (Read-Only)
               </div>
               <div className="flex-1 opacity-80 bg-[#1e1e1e]">
                 <Editor
                   height="100%"
                   language="typescript" // Should detect language dynamically
                   value={sourceFile}
                   theme="vs-dark"
                   options={{
                     readOnly: true,
                     minimap: { enabled: false },
                     fontSize: 14,
                     fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                     renderLineHighlight: 'none',
                     padding: { top: 10, bottom: 10 }
                   }}
                 />
               </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="bg-[#2b2d31] w-[1px]" />

          {/* Right Pane: Test (Editable) */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
               <div className="h-6 bg-[#1e1e1e] border-b border-[#2b2d31] flex items-center px-3 text-xs text-blue-400 select-none font-medium">
                  Generated Test (Editable)
               </div>
               <div className="flex-1 bg-[#1e1e1e]">
                 {testFile ? (
                   <Editor
                     height="100%"
                     language="typescript"
                     value={testFile}
                     theme="vs-dark"
                     onMount={handleEditorDidMount}
                     onChange={(val) => setTestFile(val || '')}
                     options={{
                       minimap: { enabled: false },
                       fontSize: 14,
                       fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                       padding: { top: 10, bottom: 10 }
                     }}
                   />
                 ) : (
                   <div className="h-full flex items-center justify-center text-zinc-500 flex-col gap-2">
                     <MessageSquare className="w-8 h-8 opacity-50" />
                     <p>Generate to see tests...</p>
                   </div>
                 )}
               </div>
            </div>
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
    </div>
  );
};
