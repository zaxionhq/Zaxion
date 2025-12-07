import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Github, Brain, Sparkles, Code2, GitBranch, Zap, ArrowRight, CheckCircle, MessageCircle, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { GitHubButton } from '@/components/ui/github-button';
import { AIButton } from '@/components/ui/ai-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileTree } from '@/components/FileTree';
import { TestSummaryCard, TestSummary } from '@/components/TestSummaryCard';
import { CodeViewer } from '@/components/CodeViewer';
import { Chatbot } from '@/components/Chatbot';
import { useTestGeneration } from '@/hooks/useTestGeneration';
import { useSession } from '@/hooks/useSession';
import { useFileTreeState } from '@/hooks/useFileTreeState';
import { api } from '@/lib/api';

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentStep, setCurrentStep] = useState<'connect' | 'select' | 'summarize' | 'generate' | 'review' | 'create-pr'>('connect');
  const [editedCode, setEditedCode] = useState<string>(''); // New state for edited code
  const [isChatbotOpen, setIsChatbotOpen] = useState(false); // New state for chatbot
  const [isDemoMode, setIsDemoMode] = useState(import.meta.env.VITE_MOCK === 'true'); // Demo mode state
  
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
    }
  }, [generatedCode]);

  const handleGitHubConnect = () => {
    // Check if we're in mock mode
    const mockMode = import.meta.env.VITE_MOCK === 'true' || isDemoMode;
    
    if (mockMode) {
      // In demo mode, simulate successful connection
      console.log('Running in demo mode - simulating GitHub connection');
      setIsConnected(true);
      setCurrentStep('select');
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
        setCurrentStep('select');
        loadRepos(); // Load repositories when user connects
      }
    }
  }, [sessionLoading, user, loadRepos, currentStep]);

  // Listen for the github-connected event
  React.useEffect(() => {
    const handleGitHubConnected = () => {
      console.log('GitHub connected event received');
      setIsConnected(true);
      setCurrentStep('select');
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

  const handleGenerateSummaries = async () => {
    setCurrentStep('summarize');
    await generateSummaries();
  };

  const handleGenerateCode = async (summary: TestSummary) => {
    setCurrentStep('generate');
    await generateTestCode(summary, 'test');
    setCurrentStep('review'); // Transition to review step after code generation
  };

  const handleExplainCode = async (summary: TestSummary) => {
    setCurrentStep('generate');
    await generateTestCode(summary, 'explain');
    setCurrentStep('review'); 
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
    setCurrentStep('select');
    loadRepos();
  };
  
  // New: Handle creating a pull request
  const handleCreatePullRequest = () => {
    setCurrentStep('create-pr');
  };

  // Handle actual PR creation
  const handleSubmitPullRequest = async () => {
    try {
      const prData = await createPullRequest(editedCode);
      alert(`Pull Request created successfully! PR #${prData.number}\nURL: ${prData.url}`);
      setCurrentStep('create-pr');
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

  const steps = [
    { id: 'connect', title: 'Connect GitHub', completed: isConnected },
    { id: 'select', title: 'Select Files', completed: currentStep !== 'connect' && selectedFiles.length > 0 },
    { id: 'summarize', title: 'AI Analysis', completed: testSummaries.length > 0 },
    { id: 'generate', title: 'Generate Tests', completed: !!generatedCode },
    { id: 'review', title: 'Review & Edit', completed: currentStep === 'review' },
    { id: 'create-pr', title: 'Create PR', completed: false } // Separate step for PR creation
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
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-2 shadow-elegant">
              <Github className="h-5 w-5 text-primary" />
              <span className="font-medium">{user?.username || (isDemoMode ? 'demo-user' : 'my-awesome-project')}</span>
              <Badge variant="outline" className="ml-2">
                {isDemoMode ? 'Demo Mode' : 'Connected'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleStartOver}>
              Start Over
            </Button>
            <Button variant="outline" onClick={logout} disabled={sessionLoading}>
              {sessionLoading ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4 bg-card rounded-xl p-4 shadow-elegant">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-smooth ${
                    step.completed ? 'bg-success text-white' : 
                    currentStep === step.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className={`text-sm font-medium ${
                    step.completed || currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'
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

        {/* Content based on current step */}
        {currentStep === 'select' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Select Repository & Files</h2>
              <p className="text-muted-foreground">Choose a repository and select the code files you want to generate tests for</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              {/* Repository Selector */}
              {!displayRepo ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Select Repository</h3>
                  {isLoadingRepos ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading repositories...</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {repos.length > 0 ? (
                        repos.map((repo) => (
                          <div
                            key={repo.id || `repo-${repo.name}`}
                            className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={async () => {
                              try {
                                // Ensure repo has all required fields
                                if (!repo.owner || !repo.owner.login) {
                                  console.error('Repository data is incomplete:', repo);
                                  throw new Error('Repository data is incomplete. Missing owner information.');
                                }
                                
                                setLocalSelectedRepo(repo);
                                // Load branches first, then files (files will use default branch initially)
                                loadBranches(repo);
                                await loadFiles(repo);
                              } catch (error) {
                                console.error('Error selecting repository:', error);
                                // Reset the selected repo if loading files fails
                                setLocalSelectedRepo(null);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{repo.name}</h4>
                                <p className="text-sm text-muted-foreground">{repo.full_name || `${repo.owner?.login || 'unknown'}/${repo.name}`}</p>
                                {repo.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{repo.description}</p>
                                )}
                              </div>
                              <Badge variant={repo.private ? "secondary" : "outline"}>
                                {repo.private ? "Private" : "Public"}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 border rounded-lg text-center">
                          <p className="text-muted-foreground">No repositories found. Please check your GitHub connection.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-semibold">Repository: {displayRepo.name}</h3>
                      
                      {/* Branch Selector */}
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <div className="w-[200px]">
                          <Select 
                            value={selectedBranch} 
                            onValueChange={(value) => {
                              if (value && value !== selectedBranch) {
                                loadFiles(displayRepo, value);
                              }
                            }}
                            disabled={isLoadingBranches || isLoadingFiles}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={isLoadingBranches ? "Loading branches..." : "Select branch"} />
                            </SelectTrigger>
                            <SelectContent>
                              {branches.map((branch) => (
                                <SelectItem key={branch.name} value={branch.name}>
                                  {branch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {isLoadingBranches && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setLocalSelectedRepo(null);
                        resetRepositorySelection();
                        setCurrentStep('select');
                      }}
                    >
                      Change Repository
                    </Button>
                  </div>
                  
                  {/* File Selector */}
                  {isLoadingFiles ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading files...</p>
                    </div>
                  ) : (
                    <FileTree
                      data={files}
                      selectedFiles={new Set(selectedFiles)}
                      onSelectionChange={(newSet) => setSelectedFiles(Array.from(newSet))}
                      repositoryName={selectedRepo.name}
                      showIgnored={showIgnored}
                      onToggleShowIgnored={toggleShowIgnored}
                      expandedFolders={expandedFolders}
                      onToggleFolder={toggleFolder}
                      onSetExpandedFolders={setExpandedFoldersState}
                    />
                  )}
                </div>
              )}
              
                              {displayRepo && selectedFiles.length > 0 && (
                  <div className="mt-6 flex justify-center">
                    <AIButton 
                      size="lg" 
                      onClick={handleGenerateSummaries}
                      className="gap-3"
                    >
                      <Brain className="h-5 w-5" />
                      Analyze Selected Files ({selectedFiles.length})
                    </AIButton>
                  </div>
                )}
            </div>
          </div>
        )}

        {currentStep === 'summarize' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">AI Test Analysis</h2>
              <p className="text-muted-foreground">Review the AI-generated test strategies for your files</p>
            </div>

            {isGeneratingSummaries ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-ai-gradient animate-pulse"></div>
                  <Brain className="h-8 w-8 text-white absolute top-4 left-4 animate-bounce" />
                </div>
                <h3 className="text-xl font-semibold mt-6 mb-2">Analyzing your code...</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Our AI is examining your files to understand the code structure and generate optimal test strategies.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 max-w-4xl mx-auto">
                {testSummaries.map((summary) => (
                  <TestSummaryCard
                    key={summary.id}
                    summary={summary}
                    onGenerateCode={handleGenerateCode}
                    onExplainCode={handleExplainCode}
                    loading={isGeneratingCode}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 'generate' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                {generatedCode?.language === 'markdown' ? 'Code Explanation' : 'Generated Test Code'}
              </h2>
              <p className="text-muted-foreground">
                {generatedCode?.language === 'markdown' ? 'Here is the explanation of your code.' : 'Your AI-generated test code is ready!'}
              </p>
            </div>

            {isGeneratingCode ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-ai-gradient animate-pulse"></div>
                  <Code2 className="h-8 w-8 text-white absolute top-4 left-4 animate-bounce" />
                </div>
                <h3 className="text-xl font-semibold mt-6 mb-2">Generating content...</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Analyzing your code and generating the requested output.
                </p>
              </div>
            ) : generatedCode && (
              <div className="max-w-6xl mx-auto">
                <div className="mb-6 p-4 bg-card rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{generatedCode.language === 'markdown' ? 'Explanation for:' : 'Test file for:'} {generatedCode.summary.fileName}</h3>
                      <p className="text-sm text-muted-foreground">{generatedCode.summary.filePath}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{generatedCode.summary.language}</Badge>
                      {generatedCode.language !== 'markdown' && (
                        <Badge variant="outline">~{generatedCode.summary.estimatedTests} tests</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <CodeViewer
                  code={generatedCode.code}
                  language={generatedCode.language}
                  filename={`${generatedCode.summary.fileName.split('.')[0]}.test.${generatedCode.summary.fileName.split('.')[1]}`}
                />
                
                <div className="mt-6 flex justify-center gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep('summarize')}>
                    Generate More Tests
                  </Button>
                  <Button onClick={() => setCurrentStep('review')} className="gap-2">
                    <Code2 className="h-4 w-4" />
                    Review & Edit Tests
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review & Edit */}
        {currentStep === 'review' && generatedCode && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Review & Edit Generated Test Code</h2>
              <p className="text-muted-foreground">Review and edit the AI-generated test code. Use the AI Assistant to improve your tests before creating a Pull Request.</p>
              
              {/* Workflow Progress Indicator */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.completed 
                        ? 'bg-primary text-primary-foreground' 
                        : currentStep === step.id
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.completed ? '✓' : index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-2 ${
                        step.completed ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" /> Generated Test Code
                </CardTitle>
                <CardDescription>Review and edit the AI-generated test code. Use the AI Assistant to improve your tests before creating a Pull Request.</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeViewer code={editedCode} language="typescript" editable={true} onCodeChange={setEditedCode} />
                {currentStep === 'review' && (
                  <div className="flex justify-between items-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsChatbotOpen(true)}
                      className="gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Ask AI Assistant
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={handleResetEdits}>Reset Edits</Button>
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentStep('create-pr')} 
                        className="gap-2"
                      >
                        <GitBranch className="h-4 w-4" /> Ready to Create PR
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Create Pull Request */}
        {currentStep === 'create-pr' && generatedCode && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Create Pull Request</h2>
              <p className="text-muted-foreground">Your test code is ready! Create a pull request to merge your improved tests into the repository.</p>
              
              {/* Workflow Progress Indicator */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.completed 
                        ? 'bg-primary text-primary-foreground' 
                        : currentStep === step.id
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.completed ? '✓' : index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-2 ${
                        step.completed ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" /> Ready to Create PR
                </CardTitle>
                <CardDescription>Review your final test code before creating the pull request.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Final Test Code:</h4>
                  <CodeViewer 
                    code={editedCode} 
                    language={generatedCode?.language || 'typescript'} 
                    editable={false}
                  />
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep('review')}
                  >
                    Back to Review
                  </Button>
                  <Button 
                    onClick={handleSubmitPullRequest}
                    className="gap-2"
                  >
                    <GitBranch className="h-4 w-4" />
                    Create Pull Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Chatbot Component */}
      <Chatbot 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)}
        onApplyChanges={handleApplyChanges}
        currentCode={editedCode}
        language={generatedCode?.language || 'typescript'}
      />
    </div>
  );
};

export default Index;