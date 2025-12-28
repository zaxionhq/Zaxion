import React from 'react';
import { FileTree, FileNode } from '@/components/FileTree';
import { TestSummaryCard, TestSummary } from '@/components/TestSummaryCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, FileText, ArrowRight, Loader2 } from 'lucide-react';

interface AnalysisViewProps {
  files: FileNode[];
  selectedFiles: Set<string>;
  onSelectionChange: (files: Set<string>) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (folder: string) => void;
  testSummaries: TestSummary[];
  onGenerateSummaries: () => void;
  onGenerateCode: (summary: TestSummary) => void;
  isGeneratingSummaries: boolean;
  isGeneratingCode: boolean;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  files,
  selectedFiles,
  onSelectionChange,
  expandedFolders,
  onToggleFolder,
  testSummaries,
  onGenerateSummaries,
  onGenerateCode,
  isGeneratingSummaries,
  isGeneratingCode
}) => {
  return (
    <div className="container mx-auto p-6 h-[calc(100vh-80px)]">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left Panel: File Selection */}
        <div className="col-span-4 flex flex-col h-full border rounded-xl bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Select Files
            </h3>
            <span className="text-xs text-muted-foreground">
              {selectedFiles.size} selected
            </span>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <FileTree 
              data={files}
              selectedFiles={selectedFiles}
              onSelectionChange={onSelectionChange}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          </div>
        </div>

        {/* Right Panel: Analysis & Generation */}
        <div className="col-span-8 flex flex-col h-full space-y-4 overflow-hidden">
           {/* If no summaries yet, show call to action */}
           {testSummaries.length === 0 ? (
             <Card className="flex-1 flex flex-col items-center justify-center border-dashed shadow-none bg-muted/10">
                <CardContent className="flex flex-col items-center text-center max-w-md space-y-4 pt-6">
                   <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                      <Brain className="h-8 w-8 text-primary" />
                   </div>
                   <h2 className="text-2xl font-bold">Ready to Analyze</h2>
                   <p className="text-muted-foreground">
                     Select the files you want to generate tests for from the left panel, then click the button below to start the AI analysis.
                   </p>
                   <Button 
                     size="lg" 
                     onClick={onGenerateSummaries}
                     disabled={selectedFiles.size === 0 || isGeneratingSummaries}
                     className="mt-4 gap-2"
                   >
                     {isGeneratingSummaries ? (
                       <>
                         <Loader2 className="h-4 w-4 animate-spin" />
                         Analyzing Codebase...
                       </>
                     ) : (
                       <>
                         <Brain className="h-4 w-4" />
                         Analyze Selected Files
                       </>
                     )}
                   </Button>
                </CardContent>
             </Card>
           ) : (
             <div className="flex-1 overflow-auto space-y-4 pr-2">
                <div className="flex items-center justify-between mb-2">
                   <h2 className="text-xl font-bold flex items-center gap-2">
                     <Brain className="h-5 w-5 text-primary" />
                     AI Analysis Results
                   </h2>
                   <Button variant="outline" size="sm" onClick={onGenerateSummaries} disabled={isGeneratingSummaries}>
                     {isGeneratingSummaries ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                     Re-analyze
                   </Button>
                </div>
                {testSummaries.map(summary => (
                   <TestSummaryCard 
                      key={summary.id}
                      summary={summary}
                      onGenerateCode={onGenerateCode}
                      loading={isGeneratingCode}
                   />
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
