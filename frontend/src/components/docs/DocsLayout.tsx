import React from 'react';
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
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const DocsLayout = () => {
  const location = useLocation();

  const menuGroups = [
    {
      label: "Core Layer",
      items: [
        { title: "Protocol Overview", path: "/docs/overview", icon: Info },
        { title: "Governance Constitution", path: "/docs/constitution", icon: Scale },
        { title: "Canonical Policies", path: "/docs/policies", icon: FileText },
        { title: "Security Model", path: "/docs/security", icon: Shield },
      ]
    },
    {
      label: "Technical Engine",
      items: [
        { title: "Deterministic Evaluation", path: "/docs/deterministic-evaluation", icon: Terminal },
        { title: "AST Analysis", path: "/docs/ast-analysis", icon: Cpu },
        { title: "Risk-Proportional Model", path: "/docs/risk-model", icon: Shield },
        { title: "Enforcement Lifecycle", path: "/docs/enforcement-lifecycle", icon: History },
      ]
    },
    {
      label: "Implementation",
      items: [
        { title: "GitHub Integration", path: "/docs/implementation/github-integration", icon: BookOpen },
        { title: "Policy Configuration", path: "/docs/implementation/policy-configuration", icon: Terminal },
        { title: "Override Protocol", path: "/docs/implementation/override-protocol", icon: Lock },
      ]
    },
    {
      label: "Governance & Audit",
      items: [
        { title: "Institutional Audit Trail", path: "/docs/audit-trail", icon: History },
        { title: "Signed Overrides", path: "/docs/signed-overrides", icon: FileText },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/zaxion-logo.png" 
              alt="Zaxion" 
              className="h-6 w-auto object-contain brightness-0 invert opacity-70 group-hover:opacity-100 transition-opacity" 
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
                  {group.items.map((item, j) => (
                    <Link
                      key={j}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-1.5 text-xs font-medium rounded-md transition-all group",
                        location.pathname === item.path 
                          ? "bg-white/5 text-white border border-white/5" 
                          : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.02]"
                      )}
                    >
                      <item.icon className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        location.pathname === item.path ? "text-indigo-400" : "group-hover:text-slate-300"
                      )} />
                      {item.title}
                    </Link>
                  ))}
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
