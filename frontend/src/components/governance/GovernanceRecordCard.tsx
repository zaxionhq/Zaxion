import React from 'react';
import { Shield, Lock, Hash, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GovernanceRecordCardProps {
  className?: string;
}

export const GovernanceRecordCard: React.FC<GovernanceRecordCardProps> = ({ className }) => {
  return (
    <div className={cn(
      "w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden shadow-2xl transition-colors duration-300",
      className
    )}>
      {/* Header */}
      <div className="border-b border-border bg-muted/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive/80" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60">
            Zaxion Governance Decision
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-destructive/10 border border-destructive/20">
          <Lock className="h-3 w-3 text-destructive/80" />
          <span className="text-[10px] font-mono font-bold text-destructive/80 text-[8px] md:text-[10px]">STATUS: BLOCKED · MANDATORY POLICY VIOLATION</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-1.5">+
            <span className="text-[10px] font-mono uppercase text-muted-foreground/40 tracking-wider">Policy Violated</span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-destructive/80 bg-destructive/5 px-2 py-1 rounded border border-destructive/10 w-fit">coverage-auth-required</p>
              <span className="text-[8px] font-mono text-muted-foreground/30">MANDATORY · HIGH SEVERITY</span>
            </div>
          </div>
          <div className="space-y-1.5 text-left md:text-right">
            <span className="text-[10px] font-mono uppercase text-muted-foreground/40 tracking-wider">Violation Reason</span>
            <p className="text-xs font-medium text-muted-foreground/80">Authentication-related file modified without test coverage</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-muted-foreground/40 tracking-wider">Observed Change</span>
            <p className="text-xs text-muted-foreground/60">File modified · No corresponding test files detected</p>
          </div>
          <div className="space-y-1.5 text-left md:text-right">
            <span className="text-[10px] font-mono uppercase text-muted-foreground/40 tracking-wider">Affected File</span>
            <p className="text-xs font-bold text-neon-cyan">highRisk</p>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase text-muted-foreground/40 tracking-wider">Required Action</span>
          <div className="bg-neon-cyan/5 border border-neon-cyan/10 rounded-lg p-4 flex items-center gap-3">
            <div className="w-4 h-4 rounded border border-neon-cyan/40 flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
            </div>
            <p className="text-xs text-neon-cyan font-medium">
              Add unit tests covering authentication logic in highRisk
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-border space-y-2">
          <span className="text-[10px] font-mono uppercase text-muted-foreground/40 tracking-wider">Operational Impact</span>
          <p className="text-xs text-muted-foreground/60 leading-relaxed italic">
            FAILED: Modified 3 high-risk file(s) (auth/payment/config) without adding tests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground/30" />
            <div className="space-y-0.5">
              <span className="block text-[9px] font-mono uppercase text-muted-foreground/30">Timestamp</span>
              <span className="block text-[10px] font-mono text-muted-foreground/60">2026-03-29T18:42Z</span>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-start md:justify-end">
            <div className="space-y-0.5 text-left md:text-right">
              <span className="block text-[9px] font-mono uppercase text-muted-foreground/30">Integrity Hash</span>
              <span className="block text-[10px] font-mono text-muted-foreground/60 truncate max-w-[120px]">7f92c41a9d...</span>
            </div>
            <Hash className="h-4 w-4 text-muted-foreground/30" />
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="px-6 py-3 bg-muted/10 border-t border-border flex items-center justify-center">
        <span className="text-[9px] font-mono text-muted-foreground/20 uppercase tracking-[0.3em] text-center">
          Deterministic Governance Protocol v7.0.0
        </span>
      </div>
    </div>
  );
};
