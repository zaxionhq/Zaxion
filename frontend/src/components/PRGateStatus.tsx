import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldAlert, ShieldCheck, Info, Loader2, Lock, Unlock, History } from 'lucide-react';
import { PRDecision, DecisionObject } from '@/hooks/usePRGate';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

interface PRGateStatusProps {
  decision: PRDecision | null;
  isLoading: boolean;
  onOverride: (reason: string) => Promise<void>;
}

export const PRGateStatus: React.FC<PRGateStatusProps> = ({ decision, isLoading, onOverride }) => {
  const [justification, setJustification] = useState('');
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading && !decision) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading Quality Gate Status...</span>
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
      await onOverride(justification);
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
            <CardTitle className="text-lg">Quality Gate: {decision.decision.replace('_', ' ')}</CardTitle>
          </div>
          <Badge variant={isPassed ? "default" : isBlocked ? "destructive" : "outline"} className="capitalize">
            {data.evaluationStatus}
          </Badge>
        </div>
        <CardDescription className="font-medium mt-1">
          {decision.decisionReason}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default" className="bg-background/50 border-none">
          <Brain className="h-4 w-4" />
          <AlertTitle>AI Advisor Rationale</AlertTitle>
          <AlertDescription className="text-sm italic">
            "{data.advisor.rationale}"
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-current/10">
          <div className="flex items-center gap-4">
            <span>Risk: <Badge variant="outline" className="text-[10px] h-4">{data.advisor.riskAssessment.riskLevel}</Badge></span>
            <span>Policy: v{decision.policy_version || '1.0.0'}</span>
          </div>
          <span>Decision ID: #{decision.id}</span>
        </div>

        {isOverridden && data.override && (
          <div className="mt-4 p-3 rounded-md bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4" />
              Bypass History
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
                  Override Gate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manual Quality Gate Override</DialogTitle>
                  <DialogDescription>
                    Bypassing the quality gate is an audited action. Please provide a clear justification for this override.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Justification (min 10 characters)</label>
                    <Textarea 
                      placeholder="e.g., Emergency production fix, tests will be added in follow-up PR..." 
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      className="h-24"
                    />
                  </div>
                  <Alert variant="destructive" className="py-2">
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Only users with Admin or Maintainer permissions on GitHub are authorized to execute this override.
                    </AlertDescription>
                  </Alert>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsOverrideDialogOpen(false)}>Cancel</Button>
                  <Button 
                    variant="destructive" 
                    disabled={justification.length < 10 || isSubmitting}
                    onClick={handleOverrideSubmit}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                    Confirm Bypass
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
