import React, { useState, useEffect, useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Shield, 
  Cpu, 
  Terminal, 
  Lock, 
  ChevronRight,
  ExternalLink,
  Info,
  Scale,
  History,
  FileText,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const DocsLayout = () => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const menuGroups = useMemo(() => [
    {
      label: "Core Layer",
      items: [
        { title: "Protocol Overview", path: "/docs/overview", icon: Info },
        { 
          title: "Governance Constitution", 
          path: "/docs/constitution", 
          icon: Scale,
          children: [
            { title: "The Law", path: "/docs/constitution#the-law" },
            { title: "The Judgment", path: "/docs/constitution#the-judgment" },
            { title: "The Memory", path: "/docs/constitution#the-memory" },
          ]
        },
        { title: "Canonical Policies", path: "/docs/policies", icon: FileText },
        { 
          title: "Security Model", 
          path: "/docs/security", 
          icon: Shield,
          children: [
            { title: "Stateless Pipeline", path: "/docs/security#stateless-pipeline" },
            { title: "Zero-Execution", path: "/docs/security#zero-execution" },
            { title: "Audit Integrity", path: "/docs/security#audit-integrity" },
          ]
        },
      ]
    },
    {
      label: "Technical Layer",
      items: [
        { title: "Deterministic Evaluation", path: "/docs/deterministic-evaluation", icon: Cpu },
        { title: "AST-Fact Extraction", path: "/docs/ast-analysis", icon: Terminal },
        { title: "Risk Scoring Model", path: "/docs/risk-model", icon: Shield },
        { title: "Enforcement Lifecycle", path: "/docs/enforcement-lifecycle", icon: History },
      ]
    },
    {
      label: "Implementation",
      items: [
        { title: "GitHub App Setup", path: "/docs/implementation/github-integration", icon: Lock },
        { title: "Policy Configuration", path: "/docs/implementation/policy-configuration", icon: Terminal },
        { title: "Override Protocol", path: "/docs/implementation/override-protocol", icon: ExternalLink },
      ]
    },
    {
      label: "Audit & Ledger",
      items: [
        { title: "Institutional Audit Trail", path: "/docs/audit-trail", icon: History },
        { title: "Signed Overrides", path: "/docs/signed-overrides", icon: FileText },
      ]
    }
  ], []);

  // Auto-expand the group that contains the current path
  useEffect(() => {
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        const isPathActive = location.pathname === item.path;
        const isChildActive = item.children?.some(child => location.pathname + location.hash === child.path);
        
        if ((isPathActive || isChildActive) && item.children) {
          setExpandedItems(prev => prev.includes(item.title) ? prev : [...prev, item.title]);
        }
      });
    });
  }, [location.pathname, location.hash, menuGroups]);

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  return (
    <div className="flex h-screen bg-[#050505] text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3.5 group">
            <img 
              src="/zaxion-logo.png" 
              alt="Zaxion" 
              className="h-8 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity" 
            />
            <span className="font-bold tracking-tight text-sm text-slate-200 group-hover:text-white transition-colors uppercase">
              ZAXION <span className="text-slate-500 font-medium lowercase italic">Docs</span>
            </span>
          </Link>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-[10px] font-mono text-slate-400 font-medium tracking-wider bg-white/5 px-2 py-0.5 rounded border border-white/5">
              v1.0.0-BETA
            </div>
            <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
              STABLE
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-8">
            {menuGroups.map((group, i) => (
              <div key={i} className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 px-4">
                  {group.label}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item, j) => {
                    const isExpanded = expandedItems.includes(item.title);
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <div key={j} className="space-y-1">
                        <div className="flex items-center group relative">
                          <Link
                            to={item.path}
                            className={cn(
                              "flex-1 flex items-center gap-3 px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                              isActive 
                                ? "bg-white/5 text-white border border-white/5" 
                                : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.02]"
                            )}
                          >
                            <item.icon className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-colors",
                              isActive ? "text-indigo-400" : "group-hover:text-slate-300"
                            )} />
                            {item.title}
                          </Link>
                          
                          {item.children && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                toggleExpand(item.title);
                              }}
                              className="absolute right-2 p-1 text-slate-600 hover:text-slate-400 transition-colors"
                            >
                              <ChevronDown className={cn(
                                "h-3 w-3 transition-transform duration-200",
                                isExpanded ? "rotate-180" : ""
                              )} />
                            </button>
                          )}
                        </div>

                        {item.children && isExpanded && (
                          <div className="ml-9 border-l border-white/5 space-y-1 mt-1">
                            {item.children.map((child, k) => {
                              const isChildActive = location.pathname + location.hash === child.path;
                              
                              return (
                                <Link
                                  key={k}
                                  to={child.path}
                                  className={cn(
                                    "flex items-center gap-2 px-4 py-1 text-[11px] font-medium transition-colors relative group",
                                    isChildActive ? "text-indigo-400" : "text-slate-600 hover:text-slate-300"
                                  )}
                                >
                                  <div className={cn(
                                    "absolute left-0 w-2 h-[1px]",
                                    isChildActive ? "bg-indigo-400/50" : "bg-white/5"
                                  )} />
                                  {child.title}
                                  <ChevronRight className={cn(
                                    "h-2 w-2 transition-opacity ml-auto",
                                    isChildActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  )} />
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-white/5">
          <a 
            href="mailto:governance@zaxion.ai" 
            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all group"
          >
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-slate-400">Support</div>
              <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Core Protocol</div>
            </div>
            <ExternalLink className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-[#050505]">
        <ScrollArea className="h-full">
          <div className="container max-w-3xl mx-auto px-12 py-16 relative z-10">
            <Outlet />
            
            <footer className="mt-32 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.2em]">
                © 2026 Zaxion Governance Protocol
              </div>
              <div className="flex gap-8">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-slate-700" />
                  <span className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.1em]">Institutional Grade</span>
                </div>
                <div className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.1em]">
                  Feb 2026
                </div>
              </div>
            </footer>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default DocsLayout;
