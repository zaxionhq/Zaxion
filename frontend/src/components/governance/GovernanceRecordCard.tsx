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
            Governance Record
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
          <Lock className="h-3 w-3 text-red-500/80" />
          <span className="text-[10px] font-mono font-bold text-red-500/80">BLOCKED</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-white/20 tracking-wider">Policy Enforcement</span>
            <p className="text-sm font-bold text-white/80">PROD_TEST_COVERAGE v1.2</p>
          </div>
          <div className="space-y-1.5 text-right">
            <span className="text-[10px] font-mono uppercase text-white/20 tracking-wider">Decision ID</span>
            <p className="text-sm font-mono text-white/60">ZAX-9F3A21</p>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase text-white/20 tracking-wider">Evidence Summary</span>
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-white/20 mt-0.5" />
              <p className="text-xs text-white/50 leading-relaxed">
                2 source files missing required integration test coverage.
              </p>
            </div>
          </div>
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
