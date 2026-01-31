import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldAlert, ShieldCheck, Info, Loader2, Lock, Unlock, History, CheckCircle2, ListChecks, FileCode, Lightbulb, Clock, Brain, AlertCircle } from 'lucide-react';
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

  const data = React.useMemo(() => {
    if (!decision?.raw_data) return null;
    try {
      return typeof decision.raw_data === 'string' 
        ? JSON.parse(decision.raw_data) as DecisionObject
        : decision.raw_data as unknown as DecisionObject;
    } catch (e) {
      console.error("Failed to parse decision raw_data in PRGateStatus:", e);
      return null;
    }
  }, [decision]);

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

  if (!decision || !data) return null;

  const isBlocked = decision.decision === 'BLOCK';
  const isPassed = decision.decision === 'PASS' || decision.decision === 'OVERRIDDEN_PASS';
  const isWarning = decision.decision === 'WARN';
  const isOverridden = decision.decision === 'OVERRIDDEN_PASS';

  const getStatusIcon = () => {
    if (isOverridden) return <Unlock className="h-6 w-6 text-amber-500" />;
    if (isPassed) return <ShieldCheck className="h-6 w-6 text-green-500" />;
    if (isBlocked) return <ShieldAlert className="h-6 w-6 text-destructive" />;
    return <Info className="h-6 w-6 text-amber-500" />;
  };

  const getStatusColor = () => {
    if (isOverridden) return 'bg-amber-500/5 border-amber-500/20 text-amber-400';
    if (isPassed) return 'bg-green-500/5 border-green-500/20 text-green-400';
    if (isBlocked) return 'bg-destructive/5 border-destructive/20 text-destructive';
    return 'bg-amber-500/5 border-amber-500/20 text-amber-400';
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
    <Card className={`border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden`}>
      <div className={`h-1 w-full ${isPassed ? 'bg-green-500' : isBlocked ? 'bg-destructive' : 'bg-amber-500'}`} />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getStatusColor()}`}>
              {getStatusIcon()}
            </div>
            <div>
              <CardTitle className="text-xl font-black tracking-tight uppercase">
                Status: {decision.decision.replace('_', ' ')}
              </CardTitle>
              <CardDescription className="text-white/40 font-mono text-[10px] mt-1 uppercase tracking-widest">
                Governance Evaluation ID: {decision.id}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={`font-black text-[10px] px-3 py-1 border-current/30 ${getStatusColor()}`}>
              {data.evaluationStatus}
            </Badge>
            <span className="text-[10px] text-white/20 font-mono uppercase tracking-tighter">
              v{data.policy_version || '1.0.0'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Core Decision Summary */}
        <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            Policy Verdict
          </h4>
          <p className="text-sm font-bold text-white/90 leading-relaxed">
            {decision.decisionReason}
          </p>
        </div>

        {/* Resolution Path Checklist - Only if blocked */}
        {(isBlocked || isWarning) && !isOverridden && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-cyan flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Required Remediation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FileCode className="h-8 w-8" />
                </div>
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Step 01</div>
                <div className="text-xs font-bold">Fix Violations</div>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Modify the {data.facts.totalChanges} changed files to comply with policy.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <History className="h-8 w-8" />
                </div>
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Step 02</div>
                <div className="text-xs font-bold">Push Changes</div>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Zaxion will auto-trigger on the new commit SHA.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 space-y-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield className="h-8 w-8" />
                </div>
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Step 03</div>
                <div className="text-xs font-bold">Audit Approval</div>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Once passed, the PR status check will turn green.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Override History - Only if overridden */}
        {isOverridden && data.override && (
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
              <History className="h-4 w-4" />
              Governance Override Record
            </h4>
            <div className="space-y-2">
              <p className="text-sm italic text-amber-200/80">
                "{data.override.justification}"
              </p>
              <div className="flex justify-between items-center text-[10px] text-amber-500/60 font-mono uppercase tracking-widest pt-2 border-t border-amber-500/10">
                <span>Authorized by: {data.override.by}</span>
                <span>{new Date(data.override.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">
            <span>Risk: {data.advisor.riskAssessment.riskLevel}</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span>SHA: {decision.commit_sha.substring(0, 7)}</span>
          </div>
          
          {isBlocked && !isOverridden && (
            <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-widest">
                  <Lock className="h-3 w-3" />
                  Request Override
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-[#020617] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">Governance Override</DialogTitle>
                  <DialogDescription className="text-white/40 text-xs">
                    Overrides are immutable audit events. Please provide a high-fidelity business justification.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Exception Category</label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-10 text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#020617] border-white/10 text-white">
                        <SelectItem value="BUSINESS_EXCEPTION">Business Exception</SelectItem>
                        <SelectItem value="URGENT_HOTFIX">Urgent Hotfix</SelectItem>
                        <SelectItem value="LEGACY_TECHNICAL_DEBT">Technical Debt</SelectItem>
                        <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Audit Justification</label>
                    <Textarea 
                      placeholder="Explain why this policy violation should be permitted..."
                      className="min-h-[120px] bg-white/5 border-white/10 focus:border-neon-cyan/50 text-sm resize-none"
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                    />
                    <p className="text-[10px] text-white/30 italic">
                      Minimum 10 characters required for audit integrity.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsOverrideDialogOpen(false)}
                    className="text-xs font-bold uppercase tracking-widest hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleOverrideSubmit}
                    disabled={justification.length < 10 || isSubmitting}
                    className="bg-neon-cyan text-black hover:bg-neon-cyan/90 text-xs font-bold uppercase tracking-widest px-6"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Override'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
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
