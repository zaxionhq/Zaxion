import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import logger from '@/lib/logger';

const PAGE_SIZE = 50;

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
    justification?: string;
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

function buildDateRange(dateFilter: string): { from?: string; to?: string } {
  const to = new Date();
  const from = new Date();
  if (dateFilter === '7') {
    from.setDate(from.getDate() - 7);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  if (dateFilter === '30') {
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  return {};
}

export const DecisionExplorer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('repo') || '');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const dateRange = useMemo(() => {
    if (dateFilter === 'custom' && customFrom && customTo) {
      return { from: new Date(customFrom).toISOString(), to: new Date(customTo).toISOString() };
    }
    return buildDateRange(dateFilter);
  }, [dateFilter, customFrom, customTo]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const limit = PAGE_SIZE;
        const offset = page * PAGE_SIZE;
        const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
        if (dateRange.from) params.set('from', dateRange.from);
        if (dateRange.to) params.set('to', dateRange.to);

        const [decisionsData, reposData] = await Promise.all([
          api.get<Decision[]>(`/v1/analytics/governance/decisions?${params}`),
          api.get<Repository[]>('/v1/github/repos').catch(() => [])
        ]);

        setDecisions(Array.isArray(decisionsData) ? decisionsData : []);
        setRepositories(Array.isArray(reposData) ? reposData : []);
      } catch (error) {
        logger.error('Failed to fetch governance data:', error);
        setDecisions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page, dateRange.from, dateRange.to]);

  const filteredDecisions = useMemo(() => {
    return decisions.filter(d => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        `${d.repo_owner}/${d.repo_name}`.toLowerCase().includes(searchLower) ||
        (d.pr_number?.toString() || '').includes(searchLower);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'OVERRIDDEN' ? !!d.override_id : d.result === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [decisions, searchTerm, statusFilter]);

  const filteredRepos = searchTerm.trim()
    ? repositories.filter(
        r =>
          r.full_name.toLowerCase().includes(searchTerm.toLowerCase().trim()) &&
          !decisions.some(
            d => `${d.repo_owner}/${d.repo_name}`.toLowerCase() === r.full_name.toLowerCase()
          )
      )
    : [];

  const hasNextPage = decisions.length >= PAGE_SIZE;
  const hasPrevPage = page > 0;

  const getResultBadge = (result: string, hasOverride: boolean) => {
    if (hasOverride) {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          OVERRIDDEN
        </Badge>
      );
    }
    switch (result) {
      case 'PASS':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            PASSED
          </Badge>
        );
      case 'BLOCK':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            BLOCKED
          </Badge>
        );
      case 'WARN':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            WARNING
          </Badge>
        );
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ limit: '1000', offset: '0' });
      if (dateRange.from) params.set('from', dateRange.from);
      if (dateRange.to) params.set('to', dateRange.to);
      const all = await api.get<Decision[]>(`/v1/analytics/governance/decisions?${params}`);
      const rows = Array.isArray(all) ? all : [];
      const headers = ['Repository', 'PR', 'Status', 'Override Reason', 'Date'];
      const csvRows = [
        headers.join(','),
        ...rows.map(d => {
          const status = d.override_id ? 'OVERRIDDEN' : d.result;
          const reason = d.override?.justification ?? '';
          const date = new Date(d.created_at).toISOString();
          return [`${d.repo_owner}/${d.repo_name}`, `#${d.pr_number}`, status, `"${reason.replace(/"/g, '""')}"`, date].join(',');
        })
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `governance-decisions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      logger.error('Export CSV failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by repo or PR..."
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
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
          <Select value={dateFilter} onValueChange={v => { setDateFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-[140px]"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                className="w-[140px]"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
              />
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border border-border/50 bg-card/30">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repository</TableHead>
              <TableHead>PR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Override reason</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3].map(i => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell colSpan={6} className="h-12 bg-muted/10" />
                </TableRow>
              ))
            ) : filteredDecisions.length === 0 && filteredRepos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No governance activity or repositories found for this date range.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredDecisions.map(decision => (
                  <TableRow key={`decision-${decision.id}`}>
                    <TableCell className="font-medium">
                      {decision.repo_owner}/{decision.repo_name}
                    </TableCell>
                    <TableCell>#{decision.pr_number}</TableCell>
                    <TableCell>{getResultBadge(decision.result, !!decision.override_id)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={decision.override?.justification ?? ''}>
                      {decision.override_id && decision.override?.justification
                        ? decision.override.justification
                        : '—'}
                    </TableCell>
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
                {filteredRepos.map(repo => (
                  <TableRow key={`repo-${repo.id}`} className="opacity-60 grayscale-[0.5]">
                    <TableCell className="font-medium italic">{repo.full_name}</TableCell>
                    <TableCell className="text-muted-foreground italic text-xs">No PR activity</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-muted-foreground/20">
                        INACTIVE
                      </Badge>
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell className="text-muted-foreground text-xs">—</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild disabled>
                        <span>No Audit Detail</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} · {PAGE_SIZE} per page
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!hasPrevPage} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!hasNextPage} onClick={() => setPage(p => p + 1)}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
