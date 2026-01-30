import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldAlert, ShieldCheck, Info, Loader2, Lock, Unlock, History, CheckCircle2, ListChecks, FileCode, Lightbulb, Clock } from 'lucide-react';
import { PRDecision, DecisionObject } from '@/hooks/usePRGate';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PRGateStatusProps {
  decision: PRDecision | null;
  isLoading: boolean;
  onOverride: (reason: string, category: string, ttlHours: number) => Promise<void>;
}

export const PRGateStatus: React.FC<PRGateStatusProps> = ({ decision, isLoading, onOverride }) => {
  const [justification, setJustification] = useState('');
  const [category, setCategory] = useState('BUSINESS_EXCEPTION');
  const [ttlHours, setTtlHours] = useState('24');
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading && !decision) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading Zaxion Guard Status...</span>
        </CardContent>
      </Card>
    );
  }

  if (!decision) return null;

  const data: DecisionObject = JSON.parse(decision.raw_data);
  const isBlocked = decision.decision === 'BLOCK';
  const isPassed = decision.decision === 'PASS' || decision.decision === 'OVERRIDDEN_PASS';
  const isWarning = decision.decision === 'WARN';
  const isOverridden = decision.decision === 'OVERRIDDEN_PASS';

  const getStatusIcon = () => {
    if (isOverridden) return <Unlock className="h-5 w-5 text-amber-500" />;
    if (isPassed) return <ShieldCheck className="h-5 w-5 text-green-500" />;
    if (isBlocked) return <ShieldAlert className="h-5 w-5 text-destructive" />;
    return <Info className="h-5 w-5 text-amber-500" />;
  };

  const getStatusColor = () => {
    if (isOverridden) return 'bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-400';
    if (isPassed) return 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400';
    if (isBlocked) return 'bg-destructive/10 border-destructive/50 text-destructive';
    return 'bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-400';
  };

  const handleOverrideSubmit = async () => {
    if (justification.length < 10) return;
    setIsSubmitting(true);
    try {
      await onOverride(justification, category, parseInt(ttlHours));
      setIsOverrideDialogOpen(false);
      setJustification('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`border-2 ${getStatusColor()}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Zaxion Guard: {decision.decision.replace('_', ' ')}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] bg-background/50">
              ID: {decision.id}
            </Badge>
            <Badge variant={isPassed ? "default" : isBlocked ? "destructive" : "outline"} className="capitalize">
              {data.evaluationStatus}
            </Badge>
          </div>
        </div>
        <CardDescription className="font-medium mt-1">
          {decision.decisionReason}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default" className="bg-background/50 border-none">
          <Brain className="h-4 w-4" />
          <AlertTitle>Zaxion Advisor Insights</AlertTitle>
          <AlertDescription className="text-sm italic">
            "{data.advisor.rationale}"
          </AlertDescription>
        </Alert>

        {/* Resolution Path Checklist */}
        {(isBlocked || isWarning) && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
              <ListChecks className="h-4 w-4" />
              Resolution Path
            </h4>
            <div className="space-y-3">
              {/* 1. Policy Step */}
              <div className="flex gap-3">
                <div className="mt-0.5">
                  {isPassed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <div className="h-4 w-4 rounded-full border-2 border-primary/30" />}
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 1: Policy Compliance</p>
                  <p className="text-[11px] text-muted-foreground">{decision.decisionReason}</p>
                </div>
              </div>

              {/* 2. File Step */}
              <div className="flex gap-3">
                <div className="mt-0.5">
                  <div className="h-4 w-4 rounded-full border-2 border-primary/30" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 2: Affected Files</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.facts.changedFiles.slice(0, 3).map((f, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] py-0 px-1 font-mono">
                        {f.split('/').pop()}
                      </Badge>
                    ))}
                    {data.facts.changedFiles.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">+{data.facts.changedFiles.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Intent Step */}
              <div className="flex gap-3">
                <div className="mt-0.5">
                  <div className="h-4 w-4 rounded-full border-2 border-primary/30" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Step 3: Resolve with Intent</p>
                  <p className="text-[11px] text-muted-foreground italic">"Analyze these files to generate missing tests and satisfy the Zaxion Guard."</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-current/10">
          <div className="flex items-center gap-4">
            <span>Risk: <Badge variant="outline" className="text-[10px] h-4">{data.advisor.riskAssessment.riskLevel}</Badge></span>
            <span>Policy: v{data.policy_version || '1.0.0'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] opacity-70">SHA: {decision.commit_sha.substring(0, 7)}</span>
          </div>
        </div>

        {isOverridden && data.override && (
          <div className="mt-4 p-3 rounded-md bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4" />
              Zaxion Ledger: Bypass History
            </div>
            <p className="text-xs italic">"{data.override.justification}"</p>
            <div className="flex justify-between text-[10px] opacity-70">
              <span>Authorized by: {data.override.by} ({data.override.role})</span>
              <span>{new Date(data.override.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}

        {isBlocked && !isOverridden && (
          <div className="pt-2 flex justify-end">
            <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Lock className="h-3 w-3" />
                  Zaxion Bypass
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Zaxion Guard: Manual Bypass</DialogTitle>
                  <DialogDescription>
                    Bypassing the quality gate is an audited action recorded in the Zaxion Ledger.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUSINESS_EXCEPTION">Business Exception</SelectItem>
                          <SelectItem value="EMERGENCY_HOTFIX">Emergency Hotfix</SelectItem>
                          <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
                          <SelectItem value="LEGACY_CODE">Legacy Code</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expiry (TTL)</label>
                      <Select value={ttlHours} onValueChange={setTtlHours}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select TTL" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 Hours</SelectItem>
                          <SelectItem value="24">24 Hours</SelectItem>
                          <SelectItem value="48">48 Hours</SelectItem>
                          <SelectItem value="168">1 Week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Justification (min 10 chars)</label>
                    <Textarea 
                      placeholder="e.g., Emergency production fix, tests will be added in follow-up PR..." 
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      className="h-24 resize-none"
                    />
                  </div>
                  
                  <div className="p-3 rounded-md bg-destructive/5 border border-destructive/10 flex gap-3 items-start">
                    <Shield className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-[11px] text-destructive leading-relaxed">
                      <strong>Authorization Required:</strong> Only users with Admin or Maintainer permissions on GitHub are authorized to execute this override.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" size="sm" onClick={() => setIsOverrideDialogOpen(false)}>Cancel</Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={justification.length < 10 || isSubmitting}
                    onClick={handleOverrideSubmit}
                    className="gap-2"
                  >
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlock className="h-3 w-3" />}
                    Confirm Zaxion Bypass
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Brain = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.105 4 4 0 0 0 5.327 2.707 3 3 0 1 0 5.335.033 4 4 0 0 0 5.325-2.703 4 4 0 0 0 .524-8.107 4 4 0 0 0-2.522-5.773A3.002 3.002 0 0 0 12 5Z"/>
    <path d="M9 13a4.5 4.5 0 0 0 3 4"/>
    <path d="M15 13a4.5 4.5 0 0 1-3 4"/>
    <path d="M12 17v4"/>
    <path d="M8 11h.01"/>
    <path d="M16 11h.01"/>
  </svg>
);
