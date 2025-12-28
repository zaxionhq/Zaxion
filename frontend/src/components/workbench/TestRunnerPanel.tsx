import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';
import { CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { useReviewStore } from '@/stores/useReviewStore';

interface TestRunnerPanelProps {
  className?: string;
}

export const TestRunnerPanel: React.FC<TestRunnerPanelProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'TEST RESULTS' | 'RAW LOGS'>('TEST RESULTS');
  const [logs, setLogs] = useState<string[]>([]);
  const { on, isConnected } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addTestResult } = useReviewStore();

  // Listen for logs
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = on('@runner/output', (data: string) => {
      setLogs(prev => [...prev, data]);
      
      // Parse for simple results
      if (data.includes('PASS')) {
        addTestResult({ type: 'pass', message: data });
      } else if (data.includes('FAIL')) {
        addTestResult({ type: 'fail', message: data });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, on, addTestResult]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const renderLogLine = (line: string, index: number) => {
    // Simple ANSI color parsing (very basic)
    // \u001b[32m -> green
    // \u001b[31m -> red
    // \u001b[0m -> reset
    
    const content = line;
    let colorClass = "text-zinc-300";
    let Icon = null;

    if (line.includes('[32m') || line.includes('PASS')) {
      colorClass = "text-green-500";
      if (line.includes('PASS')) Icon = <CheckCircle2 className="w-3 h-3 inline mr-2" />;
    } else if (line.includes('[31m') || line.includes('FAIL')) {
      colorClass = "text-red-500";
      if (line.includes('FAIL')) Icon = <XCircle className="w-3 h-3 inline mr-2" />;
    }

    // Strip ANSI codes for display if we are just coloring the whole line (simplified)
    // A real implementation would use a library like ansi-to-html
    // eslint-disable-next-line no-control-regex
    const cleanContent = content.replace(/\u001b\[\d+m/g, '');

    return (
      <div key={index} className={cn("font-mono text-xs py-0.5 whitespace-pre-wrap flex items-center", colorClass)}>
        {Icon}
        {cleanContent}
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-[#1e1e1e] border-t border-[#2b2d31]", className)}>
      {/* Header */}
      <div className="flex items-center px-4 h-9 border-b border-[#2b2d31] bg-[#1e1e1e]">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('TEST RESULTS')}
            className={cn(
              "text-[11px] font-medium transition-colors relative h-9 flex items-center gap-2",
              activeTab === 'TEST RESULTS' 
                ? "text-zinc-100 border-b border-[#e8eaed]" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            TEST RESULTS
          </button>
          <button
            onClick={() => setActiveTab('RAW LOGS')}
            className={cn(
              "text-[11px] font-medium transition-colors relative h-9 flex items-center gap-2",
              activeTab === 'RAW LOGS' 
                ? "text-zinc-100 border-b border-[#e8eaed]" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Terminal className="w-3.5 h-3.5" />
            RAW LOGS
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative" ref={scrollRef}>
         <div className="absolute inset-0 overflow-y-auto p-4">
            {logs.length === 0 && (
              <div className="text-zinc-600 text-xs italic">Waiting for test execution...</div>
            )}
            {logs.map((log, i) => renderLogLine(log, i))}
         </div>
      </div>
    </div>
  );
};
