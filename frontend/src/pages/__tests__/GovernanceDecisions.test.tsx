import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GovernanceDecisions from '../GovernanceDecisions';
import { useSession } from '@/hooks/useSession';

// Mock the dependencies
vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/components/governance/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('@/components/governance/DecisionExplorer', () => ({
  DecisionExplorer: () => <div data-testid="decision-explorer">Decision Explorer Mock</div>,
}));

describe('GovernanceDecisions Page', () => {
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
        <GovernanceDecisions />
      </BrowserRouter>
    );

    expect(screen.getByText(/Verifying Institutional Credentials/i)).toBeInTheDocument();
  });

  it('renders decision explorer when user is authenticated', () => {
    (useSession as Mock).mockReturnValue({
      user: { username: 'testuser' },
      loading: false,
    });

    render(
      <BrowserRouter>
        <GovernanceDecisions />
      </BrowserRouter>
    );

    expect(screen.getByText('Governance Audit Trail')).toBeInTheDocument();
    expect(screen.getByTestId('decision-explorer')).toBeInTheDocument();
  });

  it('shows audit mode badge', () => {
    (useSession as Mock).mockReturnValue({
      user: { username: 'testuser' },
      loading: false,
    });

    render(
      <BrowserRouter>
        <GovernanceDecisions />
      </BrowserRouter>
    );

    expect(screen.getByText('Audit Mode Active')).toBeInTheDocument();
  });
});
