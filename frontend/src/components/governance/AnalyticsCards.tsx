import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Zap, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface AnalyticsData {
  trustScore: number;
  bypassVelocity: number;
  frictionIndex: number;
  totalDecisions: number;
  totalOverrides: number;
}

interface AnalyticsCardsProps {
  data: AnalyticsData | null;
  isLoading: boolean;
}

export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-muted/50" />
            <CardContent className="h-16 bg-muted/20" />
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    {
      title: 'Trust Score',
      value: `${((data.trustScore || 0) * 100).toFixed(1)}%`,
      description: 'Systemic trust behavior and policy adherence',
      icon: Shield,
      color: (data.trustScore || 0) > 0.8 ? 'text-green-500' : 'text-yellow-500',
      trend: (data.trustScore || 0) > 0.8 ? 'Optimal' : 'Needs Review',
    },
    {
      title: 'Manual Override Rate',
      value: `${((data.bypassVelocity || 0) * 100).toFixed(1)}%`,
      description: 'Frequency of policy overrides by authorized users',
      icon: Zap,
      color: (data.bypassVelocity || 0) < 0.2 ? 'text-blue-500' : 'text-red-500',
      trend: (data.bypassVelocity || 0) < 0.2 ? 'Stable' : 'High Overrides',
    },
    {
      title: 'Workflow Impact',
      value: (data.frictionIndex || 0).toFixed(2),
      description: 'Average delay introduced by enforcement checks',
      icon: AlertTriangle,
      color: (data.frictionIndex || 0) < 5 ? 'text-indigo-500' : 'text-orange-500',
      trend: 'Minutes/PR',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.title} className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            <div className="mt-4 flex items-center gap-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                metric.color.replace('text', 'bg') + '/10 ' + metric.color
              }`}>
                {metric.trend}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
