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
        <div className="absolute left-[15px] top-8 bottom-0 w-[1px] bg-border group-hover:bg-primary/20 transition-colors" />
      )}
      <div className="relative">
        <div className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center text-[10px] font-mono font-bold text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all z-10 relative">
          {number}
        </div>
      </div>
      <div className="pb-10 space-y-2 flex-1">
        <h4 className={cn("text-sm font-bold text-foreground/90 tracking-tight", to && "group-hover:text-primary transition-colors")}>{title}</h4>
        <div className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
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
