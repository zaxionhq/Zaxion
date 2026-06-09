import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Minus, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScanProgress } from '@/hooks/usePRGate';

function RowIcon({ state }: { state: string }) {
  switch (state) {
    case 'passed':
      return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
    case 'warn':
      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    case 'running':
      return <Loader2 className="h-4 w-4 text-neon-cyan animate-spin shrink-0" />;
    case 'skipped':
      return <Minus className="h-4 w-4 text-muted-foreground shrink-0" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />;
  }
}

interface GovernanceScanProgressProps {
  scanProgress?: ScanProgress | null;
  compact?: boolean;
}

export const GovernanceScanProgress: React.FC<GovernanceScanProgressProps> = ({
  scanProgress,
  compact = false,
}) => {
  if (!scanProgress?.sections?.length) return null;

  const isRunning = scanProgress.scan_status === 'RUNNING';

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-sm',
        compact ? 'p-4' : 'p-6 md:p-8'
      )}
    >
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            Zaxion Security & Governance Report
          </p>
          <p
            className={cn(
              'text-lg font-bold mt-1',
              isRunning && 'text-neon-cyan',
              scanProgress.overall_label === 'Passed' && 'text-green-500',
              scanProgress.overall_label === 'Blocked' && 'text-destructive',
              scanProgress.overall_label === 'Warning' && 'text-amber-500'
            )}
          >
            {scanProgress.overall_label || (isRunning ? 'Analyzing…' : 'Complete')}
          </p>
        </div>
        {isRunning && <Loader2 className="h-6 w-6 text-neon-cyan animate-spin" />}
      </div>

      <div className="space-y-5">
        {scanProgress.sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              {section.label}
            </h4>
            <ul className="space-y-2">
              {section.checks.map((check) => (
                <li
                  key={check.id}
                  className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RowIcon state={check.state} />
                    <span className="text-sm text-foreground/90 truncate">{check.label}</span>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium shrink-0',
                      check.state === 'passed' && 'text-green-500',
                      check.state === 'warn' && 'text-amber-500',
                      check.state === 'failed' && 'text-destructive',
                      check.state === 'skipped' && 'text-muted-foreground',
                      check.state === 'running' && 'text-neon-cyan',
                      check.state === 'pending' && 'text-muted-foreground/50'
                    )}
                  >
                    {check.summary}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
