import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import logger from '@/lib/logger';

interface Decision {
  id: number;
  repo_owner: string;
  repo_name: string;
  pr_number: number;
  result: 'SUCCESS' | 'BLOCK' | 'FAILURE';
  override_id: number | null;
  created_at: string;
}

export const DecisionExplorer: React.FC = () => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch decisions from the backend
    const fetchDecisions = async () => {
      try {
        const response = await fetch('/api/v1/analytics/governance/decisions');
        if (response.ok) {
          const data = await response.json();
          setDecisions(data);
        }
      } catch (error) {
        logger.error('Failed to fetch decisions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDecisions();
  }, []);

  const filteredDecisions = decisions.filter(d => 
    `${d.repo_owner}/${d.repo_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.pr_number.toString().includes(searchTerm)
  );

  const getResultBadge = (result: string, hasOverride: boolean) => {
    if (hasOverride) {
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">OVERRIDDEN</Badge>;
    }
    switch (result) {
      case 'SUCCESS':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">PASSED</Badge>;
      case 'BLOCK':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">BLOCKED</Badge>;
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by repo or PR..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="rounded-md border border-border/50 bg-card/30">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>PR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell colSpan={5} className="h-12 bg-muted/10" />
                </TableRow>
              ))
            ) : filteredDecisions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No decisions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredDecisions.map((decision) => (
                <TableRow key={decision.id}>
                  <TableCell className="font-medium">
                    {decision.repo_owner}/{decision.repo_name}
                  </TableCell>
                  <TableCell>#{decision.pr_number}</TableCell>
                  <TableCell>{getResultBadge(decision.result, !!decision.override_id)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(decision.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/resolution/${decision.id}`}>
                        View Detail
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
