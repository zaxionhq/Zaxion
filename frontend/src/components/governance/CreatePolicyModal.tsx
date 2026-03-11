import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileJson, Type, Upload, CheckCircle2, AlertCircle, X, Check, ChevronsUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
}

interface Branch {
  name: string;
}

interface CreatePolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPolicyCreated: () => void;
}

export function CreatePolicyModal({ open, onOpenChange, onPolicyCreated }: CreatePolicyModalProps) {
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [mode, setMode] = useState<'json' | 'english' | 'upload' | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  // Form State
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'ORG' | 'REPO' | 'BRANCH'>('ORG');
  const [targetId, setTargetId] = useState('ORG');
  const [branchName, setBranchName] = useState(''); // Separate state for branch
  const [owningRole, setOwningRole] = useState('admin'); // Default role
  const [description, setDescription] = useState(''); // Plain English description
  const [rulesLogic, setRulesLogic] = useState('{\n  "type": "mandatory_review",\n  "count": 1\n}');

  // Dropdown Data
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isRepoOpen, setIsRepoOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  // Drag & Drop
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setStep('select');
    setMode(null);
    setName('');
    setScope('ORG');
    setTargetId('ORG');
    setBranchName('');
    setDescription('');
    setRulesLogic('{\n  "type": "mandatory_review",\n  "count": 1\n}');
  };

  const fetchRepositories = useCallback(async () => {
    setIsLoadingRepos(true);
    try {
      const response = await api.get('/v1/github/repos') as Repository[];
      setRepositories(response);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      toast({ title: "Fetch Failed", description: "Could not load repositories.", variant: "destructive" });
    } finally {
      setIsLoadingRepos(false);
    }
  }, [toast]);

  const fetchBranches = useCallback(async (repoFullName: string) => {
    if (!repoFullName) return;
    const [owner, repo] = repoFullName.split('/');
    setIsLoadingBranches(true);
    try {
      const response = await api.get(`/v1/github/repos/${owner}/${repo}/branches`) as Branch[];
      setBranches(response);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      toast({ title: "Fetch Failed", description: "Could not load branches.", variant: "destructive" });
    } finally {
      setIsLoadingBranches(false);
    }
  }, [toast]);

  useEffect(() => {
    if (scope !== 'ORG' && step === 'configure') {
      fetchRepositories();
    }
  }, [scope, step, fetchRepositories]);

  useEffect(() => {
    if (scope === 'BRANCH' && targetId && targetId !== 'ORG') {
      fetchBranches(targetId);
    }
  }, [targetId, scope, fetchBranches]);

  const handleModeSelect = (selectedMode: 'json' | 'english' | 'upload') => {
    setMode(selectedMode);
    setStep('configure');
  };

  const handleAiTranslate = async () => {
    if (!description.trim()) return;
    setIsTranslating(true);
    try {
      const result = await api.post<Record<string, unknown>>('/v1/policies/translate-natural-language', {
        description: description
      });
      setRulesLogic(JSON.stringify(result, null, 2));
      toast({
        title: "Policy Generated",
        description: "AI has translated your description into Zaxion rules.",
      });
    } catch (error) {
      toast({
        title: "Translation Failed",
        description: error instanceof Error ? error.message : "AI could not parse your description.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.md')) {
      toast({ title: "Invalid File", description: "Please upload a Markdown (.md) file.", variant: "destructive" });
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast({ title: "File Too Large", description: "Max file size is 2MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setDescription(content); // Store raw content as description
      setIsTranslating(true);
      try {
        const result = await api.post<Record<string, unknown>>('/v1/policies/translate-natural-language', {
          description: `Analyze this Markdown policy file and extract the governance rules into Zaxion JSON schema:\n\n${content}`
        });
        setRulesLogic(JSON.stringify(result, null, 2));
        toast({ title: "Policy Parsed", description: "Rules extracted from Markdown file." });
      } catch (error) {
        toast({ title: "Parse Failed", description: "Could not extract rules from Markdown.", variant: "destructive" });
      } finally {
        setIsTranslating(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCreate = async () => {
    if (!name || !rulesLogic) {
      toast({ title: "Missing Fields", description: "Name and Rules are required.", variant: "destructive" });
      return;
    }

    // Validate JSON
    try {
      JSON.parse(rulesLogic);
    } catch (e) {
      toast({ title: "Invalid JSON", description: "Please fix JSON syntax errors.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const finalTargetId = scope === 'BRANCH' ? `${targetId}:${branchName}` : targetId;

      await api.post('/v1/policies', {
        name,
        scope,
        target_id: finalTargetId,
        owning_role: owningRole,
        rules_logic: rulesLogic,
        description: description || name, // Plain English description stored here
        status: 'PENDING_APPROVAL' // Default to pending approval as per requirements
      });
      toast({ title: "Policy Submitted", description: "Your policy has been submitted for approval." });
      onPolicyCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({ 
        title: "Creation Failed", 
        description: error instanceof Error ? error.message : "Unknown error", 
        variant: "destructive" 
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) resetForm();
      onOpenChange(val);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === 'select' ? 'Create New Policy' : `Configure Policy (${mode === 'json' ? 'JSON' : mode === 'english' ? 'Plain English' : 'Upload .md'})`}</DialogTitle>
          <DialogDescription>
            {step === 'select' ? 'Choose how you want to define your governance rules.' : 'Define the policy details and scope.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
            <Card 
              className="cursor-pointer hover:border-primary hover:bg-muted/50 transition-all"
              onClick={() => handleModeSelect('json')}
            >
              <CardHeader>
                <FileJson className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>JSON Editor</CardTitle>
                <CardDescription>Directly edit the Zaxion policy schema. Best for power users.</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary hover:bg-muted/50 transition-all"
              onClick={() => handleModeSelect('english')}
            >
              <CardHeader>
                <Type className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Plain English</CardTitle>
                <CardDescription>Describe your policy in natural language. AI will generate the rules.</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary hover:bg-muted/50 transition-all"
              onClick={() => handleModeSelect('upload')}
            >
              <CardHeader>
                <Upload className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Upload .md</CardTitle>
                <CardDescription>Import an existing governance doc. We'll parse the rules.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Policy Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mandatory Review Policy" />
              </div>
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select value={scope} onValueChange={(val: string) => setScope(val as "ORG" | "REPO" | "BRANCH")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORG">Global (Org-wide)</SelectItem>
                    <SelectItem value="REPO">Specific Repository</SelectItem>
                    <SelectItem value="BRANCH">Specific Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {scope !== 'ORG' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Repository</Label>
                  <Popover open={isRepoOpen} onOpenChange={setIsRepoOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isRepoOpen}
                        className="w-full justify-between"
                        disabled={isLoadingRepos}
                      >
                        {targetId && targetId !== 'ORG' ? targetId : "Select repository..."}
                        {isLoadingRepos ? (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search repository..." />
                        <CommandList>
                          <CommandEmpty>No repository found.</CommandEmpty>
                          <CommandGroup>
                            {repositories.map((repo) => (
                              <CommandItem
                                key={repo.id}
                                value={repo.full_name}
                                onSelect={(currentValue) => {
                                  setTargetId(currentValue === targetId ? "" : currentValue);
                                  setIsRepoOpen(false);
                                  // Reset branch if repo changes
                                  setBranchName('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    targetId === repo.full_name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {repo.full_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {scope === 'BRANCH' && (
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Popover open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isBranchOpen}
                          className="w-full justify-between"
                          disabled={!targetId || isLoadingBranches}
                        >
                          {branchName || "Select branch..."}
                          {isLoadingBranches ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search branch..." />
                          <CommandList>
                            <CommandEmpty>No branch found.</CommandEmpty>
                            <CommandGroup>
                              {branches.map((branch) => (
                                <CommandItem
                                  key={branch.name}
                                  value={branch.name}
                                  onSelect={(currentValue) => {
                                    setBranchName(currentValue === branchName ? "" : currentValue);
                                    setIsBranchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      branchName === branch.name ? "opacity-100" : "opacity-0"
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
                )}
              </div>
            )}

            {mode === 'english' && (
              <div className="space-y-2">
                <Label>Description (Plain English)</Label>
                <div className="relative">
                  <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                    placeholder="Describe your policy... (e.g., 'Require 2 approvals for PRs touching /auth')"
                    className="h-32 pr-24"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {description.length}/1000
                  </div>
                </div>
                <Button 
                  onClick={handleAiTranslate} 
                  disabled={isTranslating || !description}
                  size="sm"
                  className="w-full"
                >
                  {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Type className="mr-2 h-4 w-4" />}
                  Generate Rules
                </Button>
              </div>
            )}

            {mode === 'upload' && (
              <div className="space-y-2">
                <Label>Upload Markdown File</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                       // Manually trigger handleFileUpload with a mock event
                       const file = e.dataTransfer.files[0];
                       const mockEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                       handleFileUpload(mockEvent);
                    }
                  }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".md" 
                    onChange={handleFileUpload} 
                  />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag & drop .md file</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 2MB</p>
                </div>
                {description && (
                   <div className="text-xs text-green-500 flex items-center mt-2">
                     <CheckCircle2 className="h-3 w-3 mr-1" /> File loaded ({description.length} chars)
                   </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Rules Logic (JSON)</Label>
              <div className="h-[300px] border rounded-md overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={rulesLogic}
                  onChange={(value) => setRulesLogic(value || '')}
                  theme="vs-dark" // Assuming dark mode or handle based on theme
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'configure' && (
            <Button variant="outline" onClick={() => setStep('select')} className="mr-auto">
              Back
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step === 'configure' && (
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Policy
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
