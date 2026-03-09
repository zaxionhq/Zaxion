import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GovernancePolicyLibrary from '../pages/GovernancePolicyLibrary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '../components/ui/tooltip';
import { api } from '@/lib/api';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock DashboardLayout to render children directly
vi.mock('@/components/governance/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockPolicies = [
  { id: '1', name: 'Policy 1', scope: 'GLOBAL', target_id: 'GLOBAL', status: 'APPROVED', is_enabled: true, created_by: { id: 'u1', username: 'admin', role: 'admin' }, createdAt: '2023-01-01', owning_role: 'system' },
  { id: '2', name: 'Policy 2', scope: 'REPO', target_id: 'repo/1', status: 'DRAFT', is_enabled: false, created_by: { id: 'u2', username: 'user', role: 'user' }, createdAt: '2023-01-02', owning_role: 'system' },
];

describe('GovernancePolicyLibrary Select All', () => {
    it('selects all rows when "Select All" is checked', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPolicies);
  
      render(
      <QueryClientProvider client={createTestQueryClient()}>
        <TooltipProvider>
          <GovernancePolicyLibrary />
        </TooltipProvider>
      </QueryClientProvider>
    );

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('Policy 1')).toBeInTheDocument());

    // Find the first "Select All" checkbox (in the first table, e.g., Zaxion Library)
    // Note: The page renders multiple tables. We should target one.
    // For simplicity, let's find all checkboxes.
    const checkboxes = screen.getAllByRole('checkbox');
    const selectAllCheckbox = checkboxes[0]; // Assuming first one is header checkbox

    fireEvent.click(selectAllCheckbox);

    // Check if all row checkboxes are checked
    // Note: This is a simplified check. In a real scenario, we'd be more specific.
    // However, since we share state `selectedPolicies` across tables, clicking one might select policies in that table.
    // The implementation shares `selectedPolicies` state globally for the page.
    
    // Let's verify if 'Enable Policies' button appears with correct count
    await waitFor(() => {
      expect(screen.getByText(/Enable Policies \(2\)/)).toBeInTheDocument();
    });
  });

  it('deselects all rows when "Select All" is unchecked', async () => {
      vi.mocked(api.get).mockResolvedValue(mockPolicies);
  
      render(
      <QueryClientProvider client={createTestQueryClient()}>
        <TooltipProvider>
          <GovernancePolicyLibrary />
        </TooltipProvider>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText('Policy 1')).toBeInTheDocument());

    // Select All
    const checkboxes = screen.getAllByRole('checkbox');
    const selectAllCheckbox = checkboxes[0];
    fireEvent.click(selectAllCheckbox);
    await waitFor(() => expect(screen.getByText(/Enable Policies \(2\)/)).toBeInTheDocument());

    // Deselect All
    const updatedCheckboxes = screen.getAllByRole('checkbox');
    const updatedSelectAllCheckbox = updatedCheckboxes[0];
    fireEvent.click(updatedSelectAllCheckbox);
    await waitFor(() => expect(screen.queryByText(/Enable Policies/)).not.toBeInTheDocument());
  });
});
