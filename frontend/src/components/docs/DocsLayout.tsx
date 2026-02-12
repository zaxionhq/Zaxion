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
      label: "Institutional Pillars",
      items: [
        { title: "Protocol Overview", path: "/docs/overview", icon: Info },
        { title: "Governance Constitution", path: "/docs/constitution", icon: Scale },
      ]
    },
    {
      label: "Implementation",
      items: [
        { title: "Technical Logic", path: "/docs/logic", icon: Cpu },
        { title: "Security Model", path: "/docs/security", icon: Shield },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-md flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-6 w-6 bg-neon-cyan/20 border border-neon-cyan/30 rounded flex items-center justify-center">
              <Lock className="h-3 w-3 text-neon-cyan" />
            </div>
            <span className="font-black tracking-tighter text-lg group-hover:text-neon-cyan transition-colors">
              ZAXION <span className="text-white/40">DOCS</span>
            </span>
          </Link>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-[10px] font-mono text-neon-cyan font-bold tracking-widest bg-neon-cyan/5 px-2 py-0.5 rounded border border-neon-cyan/10">
              v1.0.0-BETA
            </div>
            <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
              ACTIVE
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <nav className="space-y-8">
            {menuGroups.map((group, i) => (
              <div key={i} className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-4">
                  {group.label}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item, j) => (
                    <Link
                      key={j}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-all group",
                        location.pathname === item.path 
                          ? "bg-white/5 text-neon-cyan border border-white/5" 
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <item.icon className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        location.pathname === item.path ? "text-neon-cyan" : "group-hover:text-white"
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
            href="mailto:design-partners@zaxion.gov" 
            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
          >
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-white/60">Institutional Support</div>
              <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Contact Core Team</div>
            </div>
            <ExternalLink className="h-3 w-3 text-white/20 group-hover:text-white transition-colors" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-neon-cyan/5 blur-[120px] rounded-full" />
        </div>

        <ScrollArea className="h-full">
          <div className="container max-w-4xl mx-auto px-8 py-16 relative z-10">
            <Outlet />
            
            <footer className="mt-32 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-[9px] font-mono text-white/10 uppercase tracking-[0.4em]">
                © 2026 Zaxion Governance Protocol
              </div>
              <div className="flex gap-8">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.2em]">Operational Status</span>
                </div>
                <div className="text-[9px] font-mono text-white/10 uppercase tracking-[0.2em]">
                  Last Updated: Feb 2026
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
