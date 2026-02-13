import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GovernanceAnalytics from '../GovernanceAnalytics';
import { useSession } from '@/hooks/useSession';
import { api } from '@/lib/api';

// Mock the dependencies
vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('@/components/governance/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}));

describe('GovernanceAnalytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when session is loading', () => {
    (useSession as Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(
      <BrowserRouter>
        <GovernanceAnalytics />
      </BrowserRouter>
    );

    expect(screen.getByText(/Analyzing Risk Vectors/i)).toBeInTheDocument();
  });

  it('renders hotspots when data is loaded', async () => {
    (useSession as Mock).mockReturnValue({
      user: { username: 'testuser' },
      loading: false,
    });

    (api.get as Mock).mockResolvedValue({
      hotspots: [
        { repo: 'org/repo-a', count: 5 },
        { repo: 'org/repo-b', count: 2 },
      ],
    });

    render(
      <BrowserRouter>
        <GovernanceAnalytics />
      </BrowserRouter>
    );

    expect(screen.getByText('Governance Analytics')).toBeInTheDocument();
    
    // Wait for the data to be rendered
    const repoA = await screen.findByText('org/repo-a');
    const repoB = await screen.findByText('org/repo-b');
    
    expect(repoA).toBeInTheDocument();
    expect(repoB).toBeInTheDocument();
    expect(screen.getByText('5 Blocks')).toBeInTheDocument();
  });

  it('shows risk intelligence badge', () => {
    (useSession as Mock).mockReturnValue({
      user: { username: 'testuser' },
      loading: false,
    });
    
    (api.get as Mock).mockResolvedValue({ hotspots: [] });

    render(
      <BrowserRouter>
        <GovernanceAnalytics />
      </BrowserRouter>
    );

    expect(screen.getByText('Risk Intelligence Active')).toBeInTheDocument();
  });
});
