import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search, Filter } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import logger from '@/lib/logger';

interface Decision {
  id: number;
  repo_owner: string;
  repo_name: string;
  pr_number: number;
  result: 'PASS' | 'BLOCK' | 'WARN';
  override_id: number | null;
  override?: {
    id: string;
    status: string;
    category: string;
    justification: string;
    actor: string;
  } | null;
  created_at: string;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
}

export const DecisionExplorer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('repo') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch both decisions and repositories in parallel
        const [decisionsRes, reposRes] = await Promise.all([
          fetch('/api/v1/analytics/governance/decisions'),
          fetch('/api/v1/github/repos')
        ]);

        if (decisionsRes.ok) {
          const decisionsData = await decisionsRes.json();
          setDecisions(decisionsData);
        }

        if (reposRes.ok) {
          const reposData = await reposRes.json();
          setRepositories(reposData);
        }
      } catch (error) {
        logger.error('Failed to fetch governance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter decisions based on search and status
  const filteredDecisions = decisions.filter(d => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      `${d.repo_owner}/${d.repo_name}`.toLowerCase().includes(searchLower) ||
      (d.pr_number?.toString() || '').includes(searchLower);
    
    // Improved OVERRIDDEN filter logic
    // A decision is overridden if it has a non-null override_id
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'OVERRIDDEN' ? !!d.override_id : d.result === statusFilter);

    return matchesSearch && matchesStatus;
  });

  // Filter repositories based on search (only show if no decisions match)
  const filteredRepos = searchTerm.trim() 
    ? repositories.filter(r => 
        r.full_name.toLowerCase().includes(searchTerm.toLowerCase().trim()) &&
        !decisions.some(d => `${d.repo_owner}/${d.repo_name}`.toLowerCase() === r.full_name.toLowerCase())
      )
    : [];

  const getResultBadge = (result: string, hasOverride: boolean) => {
    if (hasOverride) {
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">OVERRIDDEN</Badge>;
    }
    switch (result) {
      case 'PASS':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">PASSED</Badge>;
      case 'BLOCK':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">BLOCKED</Badge>;
      case 'WARN':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">WARNING</Badge>;
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
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PASS">Passed</SelectItem>
              <SelectItem value="BLOCK">Blocked</SelectItem>
              <SelectItem value="WARN">Warning</SelectItem>
              <SelectItem value="OVERRIDDEN">Overridden</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
            ) : filteredDecisions.length === 0 && filteredRepos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No governance activity or repositories found.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* Active Governance Decisions */}
                {filteredDecisions.map((decision) => (
                  <TableRow key={`decision-${decision.id}`}>
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
                        <Link to={`/pr/${decision.repo_owner}/${decision.repo_name}/${decision.pr_number}`}>
                          View Detail
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Repositories without governance activity (only if searching) */}
                {filteredRepos.map((repo) => (
                  <TableRow key={`repo-${repo.id}`} className="opacity-60 grayscale-[0.5]">
                    <TableCell className="font-medium italic">
                      {repo.full_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground italic text-xs">No PR activity</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-muted-foreground/20">
                        INACTIVE
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">—</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild disabled>
                        <span>
                          No Audit Detail
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
