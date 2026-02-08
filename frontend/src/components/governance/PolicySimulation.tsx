import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/logger';

interface Policy {
  id: number;
  name: string;
  description: string;
}

interface SimulationResult {
  id: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  total_scanned: number;
  total_blocked: number;
  blast_radius: number;
  created_at: string;
}

export const PolicySimulation: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await fetch('/api/v1/policies');
        if (response.ok) {
          const data = await response.json();
          setPolicies(data);
        }
      } catch (error) {
        logger.error('Failed to fetch policies:', error);
      }
    };
    fetchPolicies();
  }, []);

  const runSimulation = async () => {
    if (!selectedPolicyId) return;

    setIsSimulating(true);
    try {
      const response = await fetch(`/api/v1/policies/${selectedPolicyId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        toast({
          title: "Simulation Started",
          description: "Policy impact analysis is running in the background.",
        });
      } else {
        throw new Error('Simulation failed to start');
      }
    } catch (error) {
      toast({
        title: "Simulation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Simulation Config</CardTitle>
          <CardDescription>Select a policy to test against historical data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Target Policy</label>
            <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a policy..." />
              </SelectTrigger>
              <SelectContent>
                {policies.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            onClick={runSimulation} 
            disabled={!selectedPolicyId || isSimulating}
          >
            {isSimulating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Blast Radius Analysis
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-border/50 bg-card/50 overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Analysis Result</CardTitle>
              <CardDescription>Visualizing the impact of policy changes.</CardDescription>
            </div>
            {result && (
              <Badge variant={result.status === 'COMPLETED' ? 'outline' : 'secondary'} className="bg-green-500/10 text-green-500 border-green-500/20">
                {result.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!result ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mb-4 opacity-10" />
              <p className="text-sm">No simulation data available.</p>
              <p className="text-xs">Configure and run a simulation to see the impact.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scanned PRs</p>
                  <p className="text-xl font-bold">{result.total_scanned}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Projected Blocks</p>
                  <p className="text-xl font-bold text-red-500">{result.total_blocked}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Blast Radius</p>
                  <p className="text-xl font-bold text-orange-500">{(result.blast_radius * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Governance Insights
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This policy would have blocked {result.total_blocked} out of {result.total_scanned} PRs in the last 30 days. 
                  The blast radius of {(result.blast_radius * 100).toFixed(1)}% indicates {result.blast_radius > 0.2 ? 'high' : 'low'} friction 
                  relative to current development velocity.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                  Promote to Production
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
