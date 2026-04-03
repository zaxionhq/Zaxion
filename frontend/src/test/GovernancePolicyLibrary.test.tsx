import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import GovernancePolicyLibrary from '../pages/GovernancePolicyLibrary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Toaster } from '@/components/ui/toaster';

// Mock dependencies
vi.mock('@/lib/api');
vi.mock('@/components/governance/CreatePolicyModal', () => ({
  CreatePolicyModal: ({ open }: { open: boolean }) => open ? <div data-testid="create-modal">Modal</div> : null
}));
vi.mock('@/components/governance/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('GovernancePolicyLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all policies including core policies', async () => {
    // Mock API responses
    (api.get as unknown as { mockImplementation: (fn: (url: string) => Promise<unknown>) => void }).mockImplementation((url: string) => {
      if (url === '/v1/policies') {
        return Promise.resolve([]);
      }
      if (url === '/v1/policies/core') {
        return Promise.resolve(Array(30).fill(null).map((_, i) => ({
          id: `core-${i}`,
          name: `Core Policy ${i + 1}`,
          description: `Description ${i + 1}`,
          scope: 'ORG',
          status: 'APPROVED',
          owning_role: 'system'
        })));
      }
      if (url === '/v1/policies?deleted=true') return Promise.resolve([]);
      if (url === '/v1/auth/me') return Promise.resolve({ id: 'user-1', role: 'admin' });
      return Promise.reject(new Error('Not found'));
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GovernancePolicyLibrary />
        <Toaster />
      </QueryClientProvider>
    );

    // Wait for core policies to load
    await waitFor(() => {
      expect(screen.getByText('Core Policy 1')).toBeInTheDocument();
      expect(screen.getByText('Core Policy 30')).toBeInTheDocument();
    });
  });

  it('shows Run Simulation button for admin users', async () => {
    (api.get as unknown as { mockImplementation: (fn: (url: string) => Promise<unknown>) => void }).mockImplementation((url: string) => {
      if (url === '/v1/policies') return Promise.resolve([]);
      if (url === '/v1/policies/core') {
        return Promise.resolve([{
          id: 'core-1',
          name: 'Core Policy 1',
          description: 'Desc',
          scope: 'ORG',
          status: 'APPROVED',
          owning_role: 'system'
        }]);
      }
      if (url === '/v1/policies?deleted=true') return Promise.resolve([]);
      if (url === '/v1/auth/me') return Promise.resolve({ id: 'user-1', role: 'admin' });
      return Promise.reject(new Error('Not found'));
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GovernancePolicyLibrary />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Run Simulation (Sandbox)')).toBeInTheDocument();
    });
  });

  it('triggers simulation when Run Simulation button is clicked', async () => {
    (api.get as unknown as { mockImplementation: (fn: (url: string) => Promise<unknown>) => void }).mockImplementation((url: string) => {
      if (url === '/v1/policies') return Promise.resolve([]);
      if (url === '/v1/policies/core') {
        return Promise.resolve([{
          id: 'core-1',
          name: 'Core Policy 1',
          description: 'Desc',
          scope: 'ORG',
          status: 'APPROVED',
          owning_role: 'system'
        }]);
      }
      if (url === '/v1/policies?deleted=true') return Promise.resolve([]);
      if (url === '/v1/auth/me') return Promise.resolve({ id: 'user-1', role: 'admin' });
      return Promise.reject(new Error('Not found'));
    });

    (api.post as unknown as { mockResolvedValue: (val: unknown) => void }).mockResolvedValue({ id: 'sim-1' });

    render(
      <QueryClientProvider client={queryClient}>
        <GovernancePolicyLibrary />
      </QueryClientProvider>
    );

    const policyCard = await screen.findByText('Core Policy 1');
    fireEvent.click(policyCard);

    const simulateBtn = await screen.findByText('Run Simulation (Sandbox)');
    fireEvent.click(simulateBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });

    expect(api.post).toHaveBeenCalledWith(
      expect.stringContaining('/v1/policies/'),
      expect.objectContaining({ is_sandbox: true })
    );
  });
});
