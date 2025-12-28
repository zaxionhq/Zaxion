import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Github, Lock, Unlock, GitBranch } from 'lucide-react';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  private: boolean;
  description?: string;
  default_branch?: string;
}

interface RepoSelectorProps {
  repos: GitHubRepo[];
  isLoading: boolean;
  onSelect: (repo: GitHubRepo) => void;
  selectedRepoId?: number;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({
  repos,
  isLoading,
  onSelect,
  selectedRepoId
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse border-border/40">
            <CardHeader className="space-y-2">
              <div className="h-5 w-1/2 bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-1/4 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="text-center py-12">
        <Github className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">No Repositories Found</h3>
        <p className="text-muted-foreground mt-2">
          We couldn't find any repositories in your GitHub account.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {repos.map((repo) => (
        <Card 
          key={repo.id}
          className={`cursor-pointer transition-all hover:shadow-md border-primary/10 hover:border-primary/50 group ${
            selectedRepoId === repo.id ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:bg-accent/50'
          }`}
          onClick={() => onSelect(repo)}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold truncate flex items-center gap-2">
                {repo.private ? (
                  <Lock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <Unlock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <span className="truncate" title={repo.name}>{repo.name}</span>
              </CardTitle>
            </div>
            <CardDescription className="line-clamp-2 h-10 mt-1">
              {repo.description || "No description provided"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full">
                <GitBranch className="h-3 w-3" />
                <span>{repo.default_branch || 'main'}</span>
              </div>
              {/* Could add updated_at here if available */}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
