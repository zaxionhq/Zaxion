import React from 'react';
import { Shield, Lock, Hash, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GovernanceRecordCardProps {
  className?: string;
}

export const GovernanceRecordCard: React.FC<GovernanceRecordCardProps> = ({ className }) => {
  return (
    <div className={cn(
      "w-full max-w-2xl bg-[#020617] border border-white/10 rounded-xl overflow-hidden shadow-2xl",
      className
    )}>
      {/* Header */}
      <div className="border-b border-white/5 bg-white/[0.02] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500/80" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
            Zaxion Governance Decision
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
          <Lock className="h-3 w-3 text-red-500/80" />
          <span className="text-[10px] font-mono font-bold text-red-500/80">STATUS: BLOCKED · MANDATORY POLICY VIOLATION</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-white/20 tracking-wider">Policy Violated</span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-red-400/80 bg-red-400/5 px-2 py-1 rounded border border-red-400/10 w-fit">coverage-auth-required</p>
              <span className="text-[8px] font-mono text-white/20">MANDATORY · HIGH SEVERITY</span>
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            <span className="text-[10px] font-mono uppercase text-white/20 tracking-wider">Violation Reason</span>
            <p className="text-xs font-medium text-white/60">Authentication-related file modified without test coverage</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-white/20 tracking-wider">Observed Change</span>
            <p className="text-xs text-white/40">File modified · No corresponding test files detected</p>
          </div>
          <div className="space-y-1.5 text-right">
            <span className="text-[10px] font-mono uppercase text-white/20 tracking-wider">Affected File</span>
            <p className="text-xs font-bold text-neon-cyan">highRisk</p>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase text-white/20 tracking-wider">Required Action</span>
          <div className="bg-neon-cyan/5 border border-neon-cyan/10 rounded-lg p-4 flex items-center gap-3">
            <div className="w-4 h-4 rounded border border-neon-cyan/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse" />
            </div>
            <p className="text-xs text-neon-cyan/80 font-medium">
              Add unit tests covering authentication logic in highRisk
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 space-y-2">
          <span className="text-[10px] font-mono uppercase text-white/20 tracking-wider">Operational Impact</span>
          <p className="text-xs text-white/40 leading-relaxed italic">
            FAILED: Modified 3 high-risk file(s) (auth/payment/config) without adding tests.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-white/20" />
            <div className="space-y-0.5">
              <span className="block text-[9px] font-mono uppercase text-white/20">Timestamp</span>
              <span className="block text-[10px] font-mono text-white/40">2026-02-11T18:42Z</span>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <div className="space-y-0.5 text-right">
              <span className="block text-[9px] font-mono uppercase text-white/20">Integrity Hash</span>
              <span className="block text-[10px] font-mono text-white/40">7f92c41a9d...</span>
            </div>
            <Hash className="h-4 w-4 text-white/20" />
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="px-6 py-3 bg-white/[0.01] border-t border-white/5 flex items-center justify-center">
        <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.3em]">
          Deterministic Governance Protocol v7.0.0
        </span>
      </div>
    </div>
  );
};
