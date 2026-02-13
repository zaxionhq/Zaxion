import React from 'react';
import { DashboardLayout } from '@/components/governance/DashboardLayout';
import { useSession } from '@/hooks/useSession';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Database, 
  Webhook, 
  ShieldCheck, 
  Lock, 
  ChevronRight,
  Globe,
  Bell,
  Fingerprint
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GovernanceSettings: React.FC = () => {
  const { user } = useSession();

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
              Governance Settings
            </h2>
            <p className="text-muted-foreground">
              Configure organization-wide policies, access controls, and infrastructure integrations.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
            <Lock className="h-3 w-3" />
            Admin Mode
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Organization Profile */}
          <GlassCard className="p-6 flex flex-col group hover:border-primary/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-bold tracking-tight text-lg mb-1">Organization Profile</h3>
            <p className="text-xs text-muted-foreground mb-4">Manage entity details, governance domain, and legal contacts.</p>
            <div className="mt-auto pt-4 border-t border-border/50 flex items-center gap-2">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">zaxion.internal</span>
            </div>
          </GlassCard>

          {/* Access Control (RBAC) */}
          <GlassCard className="p-6 flex flex-col group hover:border-primary/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-6">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="font-bold tracking-tight text-lg mb-1">Access Control (RBAC)</h3>
            <p className="text-xs text-muted-foreground mb-4">Define granular permissions for Auditors, Admins, and Developers.</p>
            <div className="mt-auto pt-4 border-t border-border/50 flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">3 Active Roles</span>
            </div>
          </GlassCard>

          {/* Audit Retention */}
          <GlassCard className="p-6 flex flex-col group hover:border-primary/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-6">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-green-500" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors" />
            </div>
            <h3 className="font-bold tracking-tight text-lg mb-1">Audit Retention</h3>
            <p className="text-xs text-muted-foreground mb-4">Configure persistence policies for enforcement decisions and traces.</p>
            <div className="mt-auto pt-4 border-t border-border/50 flex items-center gap-2">
              <Fingerprint className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">730 Day Policy</span>
            </div>
          </GlassCard>

          {/* Webhooks & Integrations */}
          <GlassCard className="p-6 flex flex-col group hover:border-primary/30 transition-all cursor-pointer">
            <div className="flex items-center justify-between mb-6">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Webhook className="h-5 w-5 text-purple-500" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
            </div>
            <h3 className="font-bold tracking-tight text-lg mb-1">Integrations</h3>
            <p className="text-xs text-muted-foreground mb-4">Connect governance events to Slack, Jira, or custom API endpoints.</p>
            <div className="mt-auto pt-4 border-t border-border/50 flex items-center gap-2">
              <Bell className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">2 Active Hooks</span>
            </div>
          </GlassCard>
        </div>

        {/* Enterprise Compliance Banner */}
        <Alert className="bg-primary/5 border-primary/20 mt-12">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-bold tracking-tight">Enterprise Compliance Guard</AlertTitle>
          <AlertDescription className="text-xs opacity-80 leading-relaxed">
            All setting changes are recorded in the system constitution and require a multi-sig override for high-risk policy modifications. 
            Currently operating under <strong>SOC2 Type II</strong> and <strong>ISO 27001</strong> enforcement standards.
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
};

export default GovernanceSettings;
