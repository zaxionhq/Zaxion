import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface DocsAccordionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const DocsAccordion: React.FC<DocsAccordionProps> = ({ 
  title, 
  subtitle, 
  children, 
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/5 rounded-lg overflow-hidden bg-white/[0.02] transition-colors hover:bg-white/[0.03]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors"
      >
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-200 tracking-tight">{title}</h4>
          {subtitle && (
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-5 pt-0 border-t border-white/5 text-sm text-slate-400 leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DocsAccordion;
