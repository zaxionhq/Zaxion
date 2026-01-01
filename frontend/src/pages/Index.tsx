import React, { useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, Brain, Sparkles, Code2, GitBranch, Zap, ArrowRight, CheckCircle, MessageCircle, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { GitHubButton } from '@/components/ui/github-button';
import { AIButton } from '@/components/ui/ai-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileTree } from '@/components/FileTree';
import { MainLayout } from '@/components/workbench/MainLayout';
import { AnalysisView } from '@/components/AnalysisView';
import { RepoSelector } from '@/components/RepoSelector';
import { TestSummaryCard, TestSummary } from '@/components/TestSummaryCard';
import { CodeViewer } from '@/components/CodeViewer';
import { Chatbot } from '@/components/Chatbot';
import { useTestGeneration, GitHubRepo } from '@/hooks/useTestGeneration';
import { useSession } from '@/hooks/useSession';
import { useFileTreeState } from '@/hooks/useFileTreeState';
import { useReviewStore } from '@/stores/useReviewStore';
import { api } from '@/lib/api';
import { usePRGate } from '@/hooks/usePRGate';
import { Input } from '@/components/ui/input';

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentStep, setCurrentStep] = useState<'connect' | 'repo-selection' | 'analysis' | 'generate' | 'ide'>('connect');
  const [editedCode, setEditedCode] = useState<string>(''); // New state for edited code
  const [isChatbotOpen, setIsChatbotOpen] = useState(false); // New state for chatbot
  const [isDemoMode, setIsDemoMode] = useState(import.meta.env.VITE_MOCK === 'true'); // Demo mode state
  const [prNumberInput, setPrNumberInput] = useState<string>(''); // State for manual PR number entry

  // PR Gate Hook
  const { latestDecision, isLoading: isPrLoading, fetchLatestDecision, executeOverride } = usePRGate();

  // Review Store
  const { setSourceFile, setTestFile, setIsReviewing } = useReviewStore();

  // IDE State
  const [activeFile, setActiveFile] = useState<string | undefined>(undefined);
  const [activeFileContent, setActiveFileContent] = useState<string>('');
  const [isFileLoading, setIsFileLoading] = useState(false);
  const prevSelectedFilesRef = React.useRef<Set<string>>(new Set());
  
  const {
    repos,
    selectedRepo,
    branches,
    selectedBranch,
    files,
    selectedFiles,
    testSummaries,
    generatedCode,
    isLoadingRepos,
    isLoadingBranches,
    isLoadingFiles,
    isGeneratingSummaries,
    isGeneratingCode,
    toggleFileSelection,
    selectAllFiles,
    clearAllFiles,
    loadRepos,
    loadBranches,
    loadFiles,
    generateSummaries,
    generateTestCode,
    resetGeneration,
    resetRepositorySelection,
    createPullRequest,
    setSelectedFiles,
    setSelectedBranch,
    showIgnored,
    toggleShowIgnored
  } = useTestGeneration();

  // Local state for selected repo (since useTestGeneration doesn't expose setter)
  const [localSelectedRepo, setLocalSelectedRepo] = useState<typeof selectedRepo>(null);

  const { user, loading: sessionLoading, logout } = useSession();
  
  const {
    expandedFolders,
    toggleFolder,
    reconcileExpansion,
    resetExpansion,
    setExpandedFolders: setExpandedFoldersState
  } = useFileTreeState();

  // Reset file tree expansion when repository changes
  React.useEffect(() => {
    resetExpansion();
  }, [selectedRepo?.id, resetExpansion]);

  // Reconcile expansion state when files list updates (e.g. branch switch)
  React.useEffect(() => {
    if (files.length > 0) {
      reconcileExpansion(files);
    }
  }, [files, reconcileExpansion]);

  // Use local state for UI, but sync with hook state
  const displayRepo = localSelectedRepo || selectedRepo;

  // Sync local state with hook state
  React.useEffect(() => {
    if (selectedRepo && !localSelectedRepo) {
      setLocalSelectedRepo(selectedRepo);
    } else if (!selectedRepo && localSelectedRepo) {
      setLocalSelectedRepo(null);
    }
  }, [selectedRepo, localSelectedRepo]);

  // Effect to update editedCode when generatedCode changes
  React.useEffect(() => {
    if (generatedCode && generatedCode.code) {
      setEditedCode(generatedCode.code);
      setTestFile(generatedCode.code); // Sync with Review Store
      setIsReviewing(true); // Auto-enter review mode when code is generated
    }
  }, [generatedCode, setTestFile, setIsReviewing]);

  // Handle file selection changes to set active file
  React.useEffect(() => {
    const currentSet = new Set(selectedFiles);
    const added = selectedFiles.filter(f => !prevSelectedFilesRef.current.has(f));
    
    if (added.length > 0) {
      const lastAdded = added[added.length - 1];
      setActiveFile(lastAdded);
    }
    prevSelectedFilesRef.current = currentSet;
  }, [selectedFiles]);

  // Fetch file content
  React.useEffect(() => {
    const fetchContent = async () => {
      if (!activeFile || !selectedRepo) return;
      
      setIsFileLoading(true);
      try {
        const response = await api.get<Record<string, unknown>[]>(`/v1/github/repos/${selectedRepo.owner.login}/${selectedRepo.name}/files?path=${encodeURIComponent(activeFile)}${selectedBranch ? `&ref=${selectedBranch}` : ''}`);
        
        if (response && response.length > 0) {
            const fileData = response[0] as { content?: string; encoding?: string };
            let content = '';
            if (fileData.content && fileData.encoding === 'base64') {
                content = atob(fileData.content);
            }
            setActiveFileContent(content);
            setSourceFile(content, activeFile); // Sync with Review Store
        }
      } catch (error) {
        console.error("Failed to fetch file content", error);
        const errorContent = '// Failed to load file content';
        setActiveFileContent(errorContent);
        setSourceFile(errorContent, activeFile);
      } finally {
        setIsFileLoading(false);
      }
    };

    fetchContent();
  }, [activeFile, selectedRepo, setSourceFile, selectedBranch]);

  const handleGitHubConnect = () => {
    // Check if we're in mock mode
    const mockMode = import.meta.env.VITE_MOCK === 'true' || isDemoMode;
    
    if (mockMode) {
      // In demo mode, simulate successful connection
      console.log('Running in demo mode - simulating GitHub connection');
      setIsConnected(true);
      setCurrentStep('repo-selection');
      // Load mock repositories
      loadRepos();
      return;
    }
    
    // If user is already connected, force a fresh OAuth flow
    if (isConnected && user) {
      // First logout to clear existing session
      logout().then(() => {
        // Then redirect to OAuth
        const url = api.buildUrl('/v1/auth/github');
        console.log('Redirecting to GitHub OAuth after logout:', url);
        window.location.href = url;
      });
      return;
    }
    
    // Always redirect to GitHub OAuth for fresh authentication
    // This ensures the OAuth flow works properly
    const url = api.buildUrl('/v1/auth/github');
    console.log('Redirecting to GitHub OAuth:', url);
    window.location.href = url;
  };

  React.useEffect(() => {
    if (!sessionLoading && user) {
      setIsConnected(true);
      // Only auto-advance if we're not in demo mode and user just connected
      const mockMode = import.meta.env.VITE_MOCK === 'true';
      if (!mockMode && currentStep === 'connect') {
        setCurrentStep('repo-selection');
        loadRepos(); // Load repositories when user connects
      }
    }
  }, [sessionLoading, user, loadRepos, currentStep]);

  // Listen for the github-connected event
  React.useEffect(() => {
    const handleGitHubConnected = () => {
      console.log('GitHub connected event received');
      setIsConnected(true);
      setCurrentStep('repo-selection');
      // Add a small delay before loading repos to ensure state updates have completed
      setTimeout(() => {
        console.log('Loading repositories after GitHub connection');
        loadRepos();
      }, 100);
    };

    console.log('Setting up github-connected event listener');
    window.addEventListener('github-connected', handleGitHubConnected);
    
    return () => {
      window.removeEventListener('github-connected', handleGitHubConnected);
    };
  }, [loadRepos]);

  const handleRepoSelect = (repo: GitHubRepo) => {
    loadFiles(repo);
    loadBranches(repo);
    setCurrentStep('analysis');
  };

  const handleRepoChange = async (repo: GitHubRepo) => {
    if (isGeneratingSummaries || isGeneratingCode) {
      alert("Please wait for the current generation to finish before switching repositories.");
      return;
    }
    loadFiles(repo);
    loadBranches(repo);
  };

  const handleBranchChange = async (branchName: string) => {
    if (isGeneratingSummaries || isGeneratingCode) {
      alert("Please wait for the current generation to finish before switching branches.");
      return;
    }
    if (selectedRepo) {
      loadFiles(selectedRepo, branchName);
    }
  };

  const handleGenerateSummaries = async () => {
    await generateSummaries();
  };

  const handleGenerateCode = async (summary: TestSummary) => {
    setCurrentStep('generate');
    await generateTestCode(summary, 'test');
    setCurrentStep('ide'); 
  };

  const handleExplainCode = async (summary: TestSummary) => {
    setCurrentStep('generate');
    await generateTestCode(summary, 'explain');
    setCurrentStep('ide'); 
  };

  const handleStartOver = () => {
    setIsConnected(false);
    setCurrentStep('connect');
    resetGeneration();
    setEditedCode(''); // Clear edited code on start over
    setIsChatbotOpen(false); // Close chatbot if open
    setLocalSelectedRepo(null); // Clear selected repo
  };

  const handleDemoMode = () => {
    setIsDemoMode(true);
    setIsConnected(true);
    setCurrentStep('repo-selection');
    loadRepos();
  };
  
  // New: Handle creating a pull request
  const handleCreatePullRequest = () => {
    // setCurrentStep('create-pr'); 
    // Logic for PR creation usually happens inside IDE now
  };

  // Handle actual PR creation
  const handleSubmitPullRequest = async () => {
    try {
      const prData = await createPullRequest(editedCode);
      alert(`Pull Request created successfully! PR #${prData.number}\nURL: ${prData.url}`);
    } catch (error) {
      console.error('Failed to create PR:', error);
      alert('Failed to create Pull Request. Please try again.');
    }
  };

  // New: Handle resetting edits
  const handleResetEdits = () => {
    if (generatedCode && generatedCode.code) {
      setEditedCode(generatedCode.code);
    }
  };

  // New: Handle applying changes from chatbot
  const handleApplyChanges = (suggestedCode: string) => {
    setEditedCode(suggestedCode);
    setIsChatbotOpen(false);
  };

  const handleFetchDecision = async (prNum: number) => {
    if (selectedRepo) {
      setPrNumberInput(prNum.toString());
      await fetchLatestDecision(selectedRepo.owner.login, selectedRepo.name, prNum);
    }
  };

  const handleOverride = async (reason: string) => {
    if (selectedRepo && prNumberInput) {
      await executeOverride(selectedRepo.owner.login, selectedRepo.name, parseInt(prNumberInput), reason);
    }
  };

  const steps = [
    { id: 'connect', title: 'Connect GitHub', completed: isConnected },
    { id: 'repo-selection', title: 'Select Repository', completed: currentStep !== 'connect' && currentStep !== 'repo-selection' },
    { id: 'analysis', title: 'AI Analysis', completed: testSummaries.length > 0 },
    { id: 'generate', title: 'Generate Tests', completed: !!generatedCode },
    { id: 'ide', title: 'Review Code', completed: currentStep === 'ide' }
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        {/* Theme Toggle and Demo Mode Indicator - Fixed position */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {import.meta.env.VITE_MOCK === 'true' && (
            <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-medium">
              Demo Mode
            </div>
          )}
          <ThemeToggle />
        </div>
        
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient opacity-10"></div>
          <div className="relative container mx-auto px-4 py-24">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-3 bg-card rounded-full px-6 py-3 shadow-elegant">
                  <Brain className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">AI-Powered Test Generation</span>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-foreground">
                Generate Smart Test Cases
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Connect your GitHub repository, select your code files, and let our AI generate comprehensive test cases using Gemini Pro.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <GitHubButton 
                  variant="hero" 
                  size="lg" 
                  onClick={handleGitHubConnect}
                  className="gap-3"
                  disabled={sessionLoading}
                >
                  <Github className="h-5 w-5" />
                  {sessionLoading ? 'Connecting...' : (isConnected ? 'Reconnect GitHub' : 'Connect GitHub Repository')}
                </GitHubButton>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-3"
                  onClick={handleDemoMode}
                >
                  <Code2 className="h-5 w-5" />
                  Try Demo Mode
                </Button>
              </div>

              {/* Progress Steps */}
              <div className="flex justify-center">
                <div className="flex items-center gap-4 bg-card rounded-xl p-6 shadow-elegant">
                  {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-smooth ${
                          step.completed ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {step.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                        </div>
                        <span className={`text-sm font-medium ${
                          step.completed ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {step.title}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-primary/20 hover:shadow-elegant transition-smooth">
              <CardHeader>
                <Github className="h-12 w-12 text-primary mb-4" />
                <CardTitle>GitHub Integration</CardTitle>
                <CardDescription>
                  Seamlessly connect to any GitHub repository and browse your codebase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• OAuth authentication</li>
                  <li>• Repository file browsing</li>
                  <li>• Smart file filtering</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-elegant transition-smooth">
              <CardHeader>
                <Brain className="h-12 w-12 text-primary mb-4" />
                <CardTitle>AI Analysis</CardTitle>
                <CardDescription>
                  Powered by Gemini Pro to understand your code and suggest optimal tests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Code complexity analysis</li>
                  <li>• Test strategy generation</li>
                  <li>• Coverage recommendations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:shadow-elegant transition-smooth">
              <CardHeader>
                <Code2 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Code Generation</CardTitle>
                <CardDescription>
                  Generate production-ready test code with best practices built-in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Multiple test frameworks</li>
                  <li>• Best practice patterns</li>
                  <li>• Ready-to-use code</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'repo-selection') {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-5xl">
          <div className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-3">
                <Github className="h-8 w-8" />
                <h1 className="text-3xl font-bold">Select a Repository</h1>
             </div>
             <Button variant="outline" onClick={handleStartOver}>Disconnect</Button>
          </div>
          
          <RepoSelector 
            repos={repos} 
            isLoading={isLoadingRepos} 
            onSelect={handleRepoSelect}
          />
        </div>
      </div>
    );
  }

  if (currentStep === 'analysis' || currentStep === 'generate') {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-[1400px] h-full flex flex-col">
           {/* Header */}
           <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">AI Analysis & Generation</h1>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setCurrentStep('repo-selection')}>Change Repository</Button>
                <Button variant="outline" onClick={handleStartOver}>Disconnect</Button>
             </div>
           </div>
           
           <div className="flex-1 overflow-hidden">
             <AnalysisView 
                files={files}
                selectedFiles={new Set(selectedFiles)}
                onSelectionChange={(newSet) => setSelectedFiles(Array.from(newSet))}
                expandedFolders={expandedFolders}
                onToggleFolder={toggleFolder}
                testSummaries={testSummaries}
                onGenerateSummaries={handleGenerateSummaries}
                onGenerateCode={handleGenerateCode}
                isGeneratingSummaries={isGeneratingSummaries}
                isGeneratingCode={isGeneratingCode}
                prDecision={latestDecision}
                isPrLoading={isPrLoading}
                onOverride={handleOverride}
                 repoOwner={selectedRepo?.owner.login}
                 repoName={selectedRepo?.name}
                 onFetchPrDecision={handleFetchDecision}
               />
           </div>
        </div>
      </div>
    );
  }

  return (
      <MainLayout 
        files={files}
        selectedFiles={new Set(selectedFiles)}
        onSelectionChange={(newSet) => setSelectedFiles(Array.from(newSet))}
        repos={repos}
        selectedRepo={selectedRepo}
        onRepoChange={handleRepoChange}
        branches={branches}
        selectedBranch={selectedBranch}
        onBranchChange={handleBranchChange}
        expandedFolders={expandedFolders}
        onToggleFolder={toggleFolder}
        onSetExpandedFolders={setExpandedFoldersState}
        activeFile={activeFile}
        activeFileContent={activeFileContent}
        onCodeChange={(code) => code && setActiveFileContent(code)}
        isLoading={isFileLoading || isLoadingFiles}
      />
  );
};

export default Index;