import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/governance/DashboardLayout';
import { AnalyticsCards } from '@/components/governance/AnalyticsCards';
import { DecisionExplorer } from '@/components/governance/DecisionExplorer';
import { PolicySimulation } from '@/components/governance/PolicySimulation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, BarChart3, History, Microscope, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Hotspot {
  repo: string;
  count: number;
}

const GovernanceDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/v1/analytics/governance/summary');
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        } else {
          throw new Error('Failed to fetch governance analytics');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
              Governance Dashboard
            </h2>
            <p className="text-muted-foreground">
              Monitor policy compliance, analyze trust signals, and simulate governance changes.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-medium">
              <Shield className="h-3 w-3" />
              Phase 6: Compliance Mode
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AnalyticsCards data={analyticsData} isLoading={isLoading} />

        <Tabs defaultValue="explorer" className="space-y-4">
          <TabsList className="bg-muted/50 border border-border/50">
            <TabsTrigger value="explorer" className="data-[state=active]:bg-background">
              <History className="mr-2 h-4 w-4" />
              Decision Explorer
            </TabsTrigger>
            <TabsTrigger value="simulation" className="data-[state=active]:bg-background">
              <Microscope className="mr-2 h-4 w-4" />
              Policy Simulation
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-background">
              <BarChart3 className="mr-2 h-4 w-4" />
              Hotspot Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="explorer" className="space-y-4">
            <div className="grid gap-4">
              <DecisionExplorer />
            </div>
          </TabsContent>

          <TabsContent value="simulation" className="space-y-4">
            <PolicySimulation />
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-card/30 p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-bold tracking-tight">Violation Hotspots</h3>
              </div>
              
              <div className="space-y-4">
                {analyticsData?.hotspots?.length > 0 ? (
                  analyticsData.hotspots.map((hotspot: Hotspot) => (
                    <div key={hotspot.repo} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-medium">{hotspot.repo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">{hotspot.count} Blocks</Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/governance/repo/${encodeURIComponent(hotspot.repo)}`}>
                            Analyze
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-10" />
                    <p className="text-sm">No violation hotspots detected.</p>
                    <p className="text-xs">Your repositories are currently following all governance policies.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default GovernanceDashboard;
