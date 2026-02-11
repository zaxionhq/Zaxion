import React from 'react';
import { CheckCircle2, XCircle, Shield, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditRecord {
  id: string;
  type: 'BLOCKED' | 'PASSED' | 'WARNED' | 'OVERRIDDEN';
  law: string;
  rationale: string;
  timestamp: string;
  hash: string;
}

const records: AuditRecord[] = [
  {
    id: 'PR-402',
    type: 'BLOCKED',
    law: 'coverage-auth-required',
    rationale: 'FAILED: Modified high-risk files (auth/payment/config) without adding tests. Action: Add unit tests to highRisk files.',
    timestamp: '2026-02-11 09:12:01',
    hash: '7f92c41a...'
  },
  {
    id: 'PR-398',
    type: 'PASSED',
    law: 'security-protocol-v2',
    rationale: 'PASSED: All security protocols satisfied. PR is eligible for merge according to Zaxion deterministic protocols.',
    timestamp: '2026-02-11 08:45:44',
    hash: 'a2e19c4b...'
  },
  {
    id: 'PR-405',
    type: 'WARNED',
    law: 'dependency-audit',
    rationale: 'WARNED: Detected 2 non-critical dependency updates. Policy transitions to ENFORCE in 7 days.',
    timestamp: '2026-02-11 08:15:33',
    hash: 'c8d4e2f1...'
  },
  {
    id: 'PR-395',
    type: 'OVERRIDDEN',
    law: 'emergency-bypass',
    rationale: 'OVERRIDDEN: Manual bypass verified by @cto. Justification: Critical security patch. Exception logged to permanent registry.',
    timestamp: '2026-02-10 23:45:12',
    hash: 'f5d22e88...'
  }
];

export const GovernanceAuditTrail = () => {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-3 w-3 text-neon-cyan" />
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Live Registry Interface</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
          <span className="text-[9px] font-mono text-neon-cyan uppercase tracking-widest">Protocol Active</span>
        </div>
      </div>

      <div className="space-y-3">
        {records.map((record, i) => (
          <div 
            key={i} 
            className="group relative p-4 rounded-lg border border-white/5 bg-white/[0.01] hover:border-white/10 transition-colors overflow-hidden"
          >
            {/* Status Indicator Bar */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                record.type === 'BLOCKED' ? "bg-red-500/50" : 
                record.type === 'PASSED' ? "bg-neon-cyan/50" : 
                record.type === 'WARNED' ? "bg-amber-500/50" : "bg-neon-purple/50"
              )} />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-white/80">{record.id}</span>
                  <span className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                    record.type === 'BLOCKED' ? "bg-red-500/10 text-red-400" : 
                    record.type === 'PASSED' ? "bg-neon-cyan/10 text-neon-cyan" : 
                    record.type === 'WARNED' ? "bg-amber-500/10 text-amber-400" : "bg-neon-purple/10 text-neon-purple"
                  )}>
                    {record.type}
                  </span>
                <span className="text-[10px] font-mono text-white/20">{record.law}</span>
              </div>
              <span className="text-[9px] font-mono text-white/10">{record.timestamp}</span>
            </div>

            <p className="text-xs text-white/40 leading-relaxed font-medium mb-3 pl-2">
              {record.rationale}
            </p>

            <div className="flex items-center justify-between pl-2">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono text-white/10 uppercase tracking-widest">Integrity Hash:</span>
                <span className="text-[8px] font-mono text-white/30 uppercase">{record.hash}</span>
              </div>
              <ArrowRight className="h-3 w-3 text-white/5 group-hover:text-white/20 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 text-center">
        <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em]">
          Longitudinal Audit Retention Active
        </p>
      </div>
    </div>
  );
};
