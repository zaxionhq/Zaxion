import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DocsStepProps {
  number: string;
  title: string;
  children: React.ReactNode;
  last?: boolean;
  to?: string;
}

const DocsStep: React.FC<DocsStepProps> = ({ number, title, children, last = false, to }) => {
  const Content = (
    <div className={cn("flex gap-6 relative group", to && "cursor-pointer")}>
      {!last && (
        <div className="absolute left-[15px] top-8 bottom-0 w-[1px] bg-white/5 group-hover:bg-indigo-500/20 transition-colors" />
      )}
      <div className="relative">
        <div className="h-8 w-8 rounded-full border border-white/10 bg-[#0a0a0a] flex items-center justify-center text-[10px] font-mono font-bold text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all z-10 relative">
          {number}
        </div>
      </div>
      <div className="pb-10 space-y-2 flex-1">
        <h4 className={cn("text-sm font-bold text-slate-200 tracking-tight", to && "group-hover:text-indigo-400 transition-colors")}>{title}</h4>
        <div className="text-sm text-slate-500 leading-relaxed max-w-2xl">
          {children}
        </div>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{Content}</Link>;
  }

  return Content;
};

export default DocsStep;
