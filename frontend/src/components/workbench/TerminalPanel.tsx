import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, Plus, ChevronDown, MoreHorizontal } from 'lucide-react';

type TerminalTab = 'OUTPUT' | 'TERMINAL' | 'DEBUG' | 'CONSOLE' | 'PROBLEMS';

export const TerminalPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TerminalTab>('TERMINAL');

  return (
    <div className="flex flex-col h-full bg-[#18181b] border-t border-[#2b2d31]">
      {/* Terminal Tabs */}
      <div className="flex items-center justify-between px-4 h-9 border-b border-[#2b2d31]">
        <div className="flex items-center gap-6">
          {['PROBLEMS', 'OUTPUT', 'DEBUG', 'TERMINAL', 'CONSOLE'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as TerminalTab)}
              className={cn(
                "text-[11px] font-medium transition-colors relative h-9 flex items-center",
                activeTab === tab 
                  ? "text-zinc-100 border-b border-[#e8eaed]" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tab}
              {tab === 'PROBLEMS' && (
                 <span className="ml-1.5 rounded-full bg-transparent border border-zinc-600 px-1.5 text-[10px] text-zinc-400">0</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1 text-zinc-400">
             <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-white">
               <Plus className="h-3.5 w-3.5" />
             </Button>
             <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-white">
               <ChevronDown className="h-3.5 w-3.5" />
             </Button>
             <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-white">
               <X className="h-3.5 w-3.5" />
             </Button>
           </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-4 font-mono text-sm overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1">
             <div className="text-zinc-500">Microsoft Windows [Version 10.0.19045.4291]</div>
             <div className="text-zinc-500">(c) Microsoft Corporation. All rights reserved.</div>
             <br />
             <div className="flex">
                <span className="text-green-500 mr-2">➜</span>
                <span className="text-blue-400 mr-2">~/project</span>
                <span className="text-zinc-400">git status</span>
             </div>
             <div className="text-zinc-300">On branch main</div>
             <div className="text-zinc-300">Your branch is up to date with 'origin/main'.</div>
             <br />
             <div className="flex">
                <span className="text-green-500 mr-2">➜</span>
                <span className="text-blue-400 mr-2">~/project</span>
                <span className="text-zinc-400">npm run dev</span>
             </div>
             <div className="text-zinc-400">
                &gt; github-testcase-generator@0.0.0 dev<br/>
                &gt; vite
             </div>
             <br />
             <div className="text-green-400">  VITE v5.4.19  ready in 345 ms</div>
             <br />
             <div className="flex items-center gap-2">
               <span className="text-zinc-500">➜</span>
               <span className="font-bold text-white">Local:</span>
               <span className="text-blue-400 hover:underline cursor-pointer">http://localhost:5173/</span>
             </div>
             <div className="flex items-center gap-2">
               <span className="text-zinc-500">➜</span>
               <span className="font-bold text-white">Network:</span>
               <span className="text-zinc-500">use --host to expose</span>
             </div>
             <br />
             <div className="flex items-center">
               <span className="text-zinc-500 animate-pulse">▋</span>
             </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
