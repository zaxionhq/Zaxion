import React from 'react';
import { cn } from '@/lib/utils';
import { Info, AlertCircle, ShieldCheck, Zap } from 'lucide-react';

interface DocsCalloutProps {
  type?: 'info' | 'warning' | 'security' | 'tip';
  title: string;
  children: React.ReactNode;
}

const DocsCallout: React.FC<DocsCalloutProps> = ({ type = 'info', title, children }) => {
  const icons = {
    info: Info,
    warning: AlertCircle,
    security: ShieldCheck,
    tip: Zap,
  };

  const styles = {
    info: 'border-white/5 bg-white/[0.01] text-slate-400',
    warning: 'border-amber-500/20 bg-amber-500/[0.02] text-amber-200/60',
    security: 'border-indigo-500/20 bg-indigo-500/[0.02] text-indigo-200/60',
    tip: 'border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-200/60',
  };

  const iconStyles = {
    info: 'text-slate-500',
    warning: 'text-amber-500/50',
    security: 'text-indigo-500/50',
    tip: 'text-emerald-500/50',
  };

  const Icon = icons[type];

  return (
    <div className={cn(
      "p-4 rounded border flex gap-4 transition-all",
      styles[type]
    )}>
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconStyles[type])} />
      <div className="space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{title}</div>
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

export default DocsCallout;
