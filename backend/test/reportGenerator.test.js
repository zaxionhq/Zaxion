import { ReportGeneratorService } from '../src/services/reportGenerator.service.js';
import { jest } from '@jest/globals';

describe('ReportGeneratorService', () => {
  let service;

  beforeEach(() => {
    service = new ReportGeneratorService();
  });

  test('should generate valid HTML report with simulation data', () => {
    const mockSimulation = {
      summary: {
        total_snapshots: 100,
        total_blocked_count: 10,
        fail_rate_change: '10%',
        policy_would_block: true
      },
      per_pr_results: [
        { pr_number: 1, repo: 'test/repo', pr_title: 'Test PR', verdict: 'BLOCK' }
      ]
    };
    
    const mockPolicy = { name: 'Test Policy' };
    
    const html = service.generateHtmlReport(mockSimulation, mockPolicy);
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Governance Simulation Report');
    expect(html).toContain('Test Policy');
    expect(html).toContain('Blocked Contributions');
    expect(html).toContain('<div class="metric-value" style="color: var(--danger);">10</div>'); // Blocked count
    expect(html).toContain('Test PR'); // PR Title
    expect(html).toContain('id="simulationData"'); // Embedded JSON
  });

  test('should handle empty simulation results gracefully', () => {
    const mockSimulation = {};
    const mockPolicy = { name: 'Empty Policy' };
    
    const html = service.generateHtmlReport(mockSimulation, mockPolicy);
    
    expect(html).toContain('Empty Policy');
    expect(html).toContain('<div class="metric-value" style="color: var(--danger);">0</div>');
  });

  test('should calculate ROI metrics correctly', () => {
    // 100 PRs * (0.5 - 0.01) hours = 49 hours saved
    const mockSimulation = {
      summary: {
        total_snapshots: 100,
        total_blocked_count: 5
      }
    };
    const mockPolicy = { name: 'ROI Policy' };
    
    const html = service.generateHtmlReport(mockSimulation, mockPolicy);
    
    expect(html).toContain('49.0h'); // Time Savings
  });
});
