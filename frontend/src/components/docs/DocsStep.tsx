import React from 'react';
import { cn } from '@/lib/utils';

interface DocsStepProps {
  number: string;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}

const DocsStep: React.FC<DocsStepProps> = ({ number, title, children, last = false }) => {
  return (
    <div className="flex gap-6 relative group">
      {!last && (
        <div className="absolute left-[15px] top-8 bottom-0 w-[1px] bg-white/5 group-hover:bg-indigo-500/20 transition-colors" />
      )}
      <div className="relative">
        <div className="h-8 w-8 rounded-full border border-white/10 bg-[#0a0a0a] flex items-center justify-center text-[10px] font-mono font-bold text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all z-10 relative">
          {number}
        </div>
      </div>
      <div className="pb-10 space-y-2">
        <h4 className="text-sm font-bold text-slate-200 tracking-tight">{title}</h4>
        <div className="text-sm text-slate-500 leading-relaxed max-w-2xl">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DocsStep;
