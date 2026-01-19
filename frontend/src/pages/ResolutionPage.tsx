import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePRGate } from '@/hooks/usePRGate';
import { useTestGeneration } from '@/hooks/useTestGeneration';
import { useFileTreeState } from '@/hooks/useFileTreeState';
import { useSession } from '@/hooks/useSession';
import { AnalysisView } from '@/components/AnalysisView';
import { MainLayout } from '@/components/workbench/MainLayout';
import { Loader2, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const ResolutionPage = () => {
  const { decisionId } = useParams<{ decisionId: string }>();
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const { latestDecision, isLoading: isPrLoading, fetchDecisionById, executeOverride, error: prError } = usePRGate();
  
  const {
    selectedRepo,
    files,
    selectedFiles,
    testSummaries,
    generatedCode,
    isGeneratingSummaries,
    isGeneratingCode,
    toggleFileSelection,
    loadFiles,
    generateSummaries,
    generateTestCode,
    createPullRequest,
    setSelectedFiles,
    loadBranches
  } = useTestGeneration();

  const {
    expandedFolders,
    toggleFolder,
    reconcileExpansion,
    resetExpansion
  } = useFileTreeState();

  const [view, setView] = useState<'analysis' | 'ide'>('analysis');
  const [editedCode, setEditedCode] = useState<string>('');

  // 1. Fetch Decision on Load
  useEffect(() => {
    if (decisionId) {
      const id = parseInt(decisionId);
      if (!isNaN(id)) {
        fetchDecisionById(id);
      }
    }
  }, [decisionId, fetchDecisionById]);

  // 2. Once decision is loaded, load the repo and files
  useEffect(() => {
    if (latestDecision && latestDecision.repo_name && latestDecision.repo_owner) {
      // We need to simulate a selected repo object for the hooks
      const repo = {
        id: 0, // Mock ID or fetch real one
        name: latestDecision.repo_name,
        owner: { login: latestDecision.repo_owner },
        full_name: `${latestDecision.repo_owner}/${latestDecision.repo_name}`,
        html_url: `https://github.com/${latestDecision.repo_owner}/${latestDecision.repo_name}`,
        description: '',
        stargazers_count: 0,
        forks_count: 0,
        updated_at: new Date().toISOString()
      };
      
      loadFiles(repo, latestDecision.commit_sha);
    }
  }, [latestDecision, loadFiles]);

  // 3. Sync expansion when files load
  useEffect(() => {
    if (files.length > 0) {
      reconcileExpansion(files);
    }
  }, [files, reconcileExpansion]);

  // 4. Handle code generation
  useEffect(() => {
    if (generatedCode?.code) {
      setEditedCode(generatedCode.code);
      setView('ide');
    }
  }, [generatedCode]);

  const handleGenerateCode = async (summary: any) => {
    await generateTestCode(summary, 'test');
  };

  const handleOverride = async (reason: string) => {
    if (latestDecision && latestDecision.pr_number) {
      await executeOverride(
        latestDecision.repo_owner, 
        latestDecision.repo_name, 
        latestDecision.pr_number, 
        reason
      );
    }
  };

  if (sessionLoading || (isPrLoading && !latestDecision)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading Zaxion Resolution Workspace...</p>
      </div>
    );
  }

  if (prError || (!latestDecision && !isPrLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Decision Not Found</AlertTitle>
          <AlertDescription>
            The Zaxion decision ID you are looking for does not exist or has expired.
            Please check the link in your GitHub Pull Request.
          </AlertDescription>
        </Alert>
        <Button variant="ghost" className="mt-4 gap-2" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" />
          Go to Homepage
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b h-14 flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight">Zaxion Resolution</span>
          </div>
          <div className="h-4 w-px bg-border mx-2" />
          <div className="flex items-center gap-2">
             <span className="text-xs font-mono text-muted-foreground">ID: {decisionId}</span>
             {latestDecision && (
               <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                 {latestDecision.repo_owner}/{latestDecision.repo_name}
               </span>
             )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-2">
              <img src={user.avatar_url} alt={user.login} className="h-6 w-6 rounded-full border" />
              <span className="text-xs font-medium">{user.login}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {view === 'analysis' ? (
          <AnalysisView 
            files={files}
            selectedFiles={selectedFiles}
            onSelectionChange={setSelectedFiles}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
            testSummaries={testSummaries}
            onGenerateSummaries={generateSummaries}
            onGenerateCode={handleGenerateCode}
            isGeneratingSummaries={isGeneratingSummaries}
            isGeneratingCode={isGeneratingCode}
            prDecision={latestDecision}
            isPrLoading={isPrLoading}
            onOverride={handleOverride}
            repoOwner={latestDecision?.repo_owner}
            repoName={latestDecision?.repo_name}
            onFetchPrDecision={() => {}} // Disabled in resolution view
          />
        ) : (
          <MainLayout 
            activeFile={undefined} // Resolution mode handles this differently
            activeFileContent=""
            editedCode={editedCode}
            onCodeChange={setEditedCode}
            onSave={() => {}}
            onRunTests={() => {}}
            onToggleChat={() => {}}
            isChatOpen={false}
            onBack={() => setView('analysis')}
            onCreatePR={async () => {
              const res = await createPullRequest(editedCode);
              alert(`PR Created: ${res.url}`);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default ResolutionPage;
