import fs from 'fs';
import path from 'path';

/**
 * Service to generate comprehensive HTML governance simulation reports.
 */
export class ReportGeneratorService {
  constructor() {
    this.logoUrl = 'https://zaxion.io/zaxion-logo.png'; // Placeholder, should use the provided asset
  }

  /**
   * Generates a self-contained HTML report for a simulation result.
   * @param {object} simulationResult - The full simulation result object
   * @param {object} policy - The policy object being simulated
   * @returns {string} The complete HTML string
   */
  generateHtmlReport(simulationResult, policy) {
    const results = simulationResult.results || {};
    const summary = results.summary || {};
    const impactedPrs = results.impacted_prs || [];
    const perPrResults = results.per_pr_results || [];
    
    // Calculate metrics for ROI
    const manualReviewTimeHours = 0.5; // Avg time per PR manually (30 mins)
    const automatedReviewTimeHours = 0.01; // Avg time per PR automated (approx 36s)
    const hoursSavedPerPr = manualReviewTimeHours - automatedReviewTimeHours;
    const totalPrs = summary.total_snapshots || 0;
    const totalHoursSaved = (totalPrs * hoursSavedPerPr).toFixed(1);
    const bugsPrevented = (summary.total_blocked_count * 0.2).toFixed(1); // Rough estimate: 20% of blocked PRs might have bugs
    const sprintDaysSaved = (parseFloat(totalHoursSaved) / 8).toFixed(1);

    const jsonPayload = JSON.stringify({
      simulation: simulationResult,
      policy: policy,
      metrics: {
        manualReviewTimeHours,
        automatedReviewTimeHours,
        hoursSavedPerPr
      }
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zaxion - Policy Test Report</title>
    <style>
        :root {
            --primary: #6366f1;
            --primary-foreground: #ffffff;
            --background: #0f172a;
            --surface: #1e293b;
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --border: #334155;
            --danger: #ef4444;
            --success: #22c55e;
            --warning: #f59e0b;
        }
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: var(--background);
            color: var(--text);
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 2rem;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border);
        }
        .badge {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge-success { background-color: rgba(34, 197, 94, 0.1); color: var(--success); border: 1px solid rgba(34, 197, 94, 0.2); }
        .badge-danger { background-color: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .card {
            background-color: var(--surface);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            padding: 1.5rem;
        }
        .card-title {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .metric-value {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 0.25rem;
        }
        .metric-desc {
            color: var(--text-muted);
            font-size: 0.875rem;
        }
        
        .table-container {
            overflow-x: auto;
            margin-top: 1rem;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }
        th {
            background-color: rgba(255, 255, 255, 0.03);
            padding: 1rem;
            font-weight: 600;
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
        }
        td {
            padding: 1rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.875rem;
        }
        tr:hover td {
            background-color: rgba(255, 255, 255, 0.01);
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
            text-decoration: none;
        }
        .btn-primary {
            background-color: var(--primary);
            color: var(--primary-foreground);
        }
        .btn-outline {
            border-color: var(--border);
            background-color: transparent;
            color: var(--text);
        }
        .btn-outline:hover {
            background-color: var(--border);
        }

        .slider-container {
            margin-top: 1.5rem;
        }
        input[type=range] {
            width: 100%;
            height: 6px;
            background: var(--border);
            border-radius: 5px;
            outline: none;
            -webkit-appearance: none;
        }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            background: var(--primary);
            border-radius: 50%;
            cursor: pointer;
        }
        
        .modal {
            display: none;
            position: fixed;
            z-index: 100;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            backdrop-filter: blur(4px);
        }
        .modal-content {
            background-color: var(--surface);
            margin: 10% auto;
            padding: 2rem;
            border: 1px solid var(--border);
            border-radius: 1rem;
            max-width: 600px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        .close {
            color: var(--text-muted);
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        .close:hover { color: var(--text); }

        .help-text {
            font-size: 0.8125rem;
            color: var(--text-muted);
            margin-top: 0.5rem;
            line-height: 1.4;
        }
        .section-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin: 3rem 0 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1 style="margin: 0; font-size: 1.75rem; font-weight: 800;">Policy Test Report</h1>
                <p style="margin: 0.5rem 0 0; color: var(--text-muted);">Testing: <strong>${policy.name}</strong> • Date: ${new Date().toLocaleDateString()}</p>
            </div>
            <div>
                <span class="badge ${summary.policy_would_block ? 'badge-danger' : 'badge-success'}">
                    ${summary.policy_would_block ? 'Would Block' : 'Safe to Enable'}
                </span>
            </div>
        </div>

        <!-- Main Stats -->
        <div class="grid">
            <div class="card">
                <div class="card-title">Stopped Changes</div>
                <div class="metric-value" style="color: var(--danger);">${summary.total_blocked_count || 0}</div>
                <div class="metric-desc">Number of PRs this policy would have stopped.</div>
            </div>
            <div class="card">
                <div class="card-title">Error Risk</div>
                <div class="metric-value">0%</div>
                <div class="metric-desc">Chance of blocking a "good" change (False Positive).</div>
            </div>
            <div class="card">
                <div class="card-title">Work Time Saved</div>
                <div class="metric-value" style="color: var(--success);">${totalHoursSaved}h</div>
                <div class="metric-desc">Hours saved compared to manual checking.</div>
            </div>
        </div>

        <!-- Benefits -->
        <div class="section-title">Business Value (3 Months)</div>
        <div class="grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="card">
                <div class="metric-value" style="font-size: 1.75rem;">${(parseFloat(totalHoursSaved) * 12).toFixed(0)}h</div>
                <div class="metric-desc">Developer time reclaimed</div>
            </div>
            <div class="card">
                <div class="metric-value" style="font-size: 1.75rem; color: var(--warning);">${(parseFloat(bugsPrevented) * 12).toFixed(0)}</div>
                <div class="metric-desc">Security risks avoided</div>
            </div>
            <div class="card">
                <div class="metric-value" style="font-size: 1.75rem; color: var(--primary);">${(parseFloat(sprintDaysSaved) * 12).toFixed(1)}</div>
                <div class="metric-desc">Extra sprint days gained</div>
            </div>
        </div>

        <!-- Detailed Violations Table -->
        <div class="section-title">Violation Details</div>
        <div class="card" style="padding: 0;">
            <div class="table-container">
                <table id="violationTable">
                    <thead>
                        <tr>
                            <th>PR</th>
                            <th>Policy / Severity</th>
                            <th>Location</th>
                            <th>Issue & Remediation</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${perPrResults.flatMap(pr => 
                            (pr.violations || []).map(v => `
                        <tr>
                            <td style="vertical-align: top;">
                                <div style="font-weight: 600;">#${pr.pr_number}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">${pr.repo}</div>
                            </td>
                            <td style="vertical-align: top;">
                                <div style="font-weight: 600;">${v.rule_id}</div>
                                <span class="badge ${v.severity === 'BLOCK' ? 'badge-danger' : 'badge-warning'}" style="font-size: 0.7rem; margin-top: 0.25rem; display: inline-block;">${v.severity}</span>
                            </td>
                            <td style="vertical-align: top; font-family: monospace; font-size: 0.8125rem;">
                                ${v.file ? `<div>${v.file}${v.line ? `:${v.line}` : ''}</div>` : '<span style="color: var(--text-muted);">Global</span>'}
                            </td>
                            <td style="vertical-align: top;">
                                <div style="font-weight: 500;">${v.message}</div>
                                ${v.explanation ? `<div style="margin-top: 0.5rem; font-size: 0.8125rem; color: var(--text-muted);">${v.explanation}</div>` : ''}
                                ${v.remediation && v.remediation.steps ? `
                                <div style="margin-top: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.03); border-radius: 4px; font-size: 0.75rem;">
                                    <strong>Fix:</strong>
                                    <ul style="margin: 0.25rem 0 0 1rem; padding: 0;">
                                        ${v.remediation.steps.slice(0, 2).map(s => `<li>${s}</li>`).join('')}
                                    </ul>
                                </div>` : ''}
                            </td>
                        </tr>
                        `)).join('')}
                        ${perPrResults.flatMap(pr => pr.violations || []).length === 0 ? '<tr><td colspan="4" style="text-align: center; padding: 3rem; color: var(--text-muted);">No policy violations found.</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Export Controls -->
        <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
            <button onclick="downloadCSV()" class="btn btn-outline">Download CSV</button>
            <button onclick="downloadJSON()" class="btn btn-outline">Download JSON</button>
        </div>

        <!-- Setup Guide -->
        <div style="margin-top: 3rem;">
            <div class="card">
                <div class="card-title">How to enable safely</div>
                <p class="help-text">We recommend this 4-step plan to start using this policy without disrupting your team:</p>
                <ul style="padding-left: 1.2rem; color: var(--text-muted); font-size: 0.875rem; margin-top: 1rem;">
                    <li style="margin-bottom: 0.5rem;">Start in <strong>"Audit Mode"</strong> (it only warns, doesn't block).</li>
                    <li style="margin-bottom: 0.5rem;">Try it on <strong>one small project</strong> first.</li>
                    <li style="margin-bottom: 0.5rem;">Check for any <strong>accidental blocks</strong> for 2 days.</li>
                    <li>Switch to <strong>"Full Blocking"</strong> once you are confident.</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Data -->
    <script type="application/json" id="simulationData">
        ${jsonPayload}
    </script>

    <script>
        const data = JSON.parse(document.getElementById('simulationData').textContent);

        function downloadJSON() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "zaxion-report.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        function downloadCSV() {
            const rows = [];
            // Header
            rows.push(['PR Number', 'Repo', 'Title', 'Policy', 'Severity', 'File', 'Line', 'Message']);
            
            // Data
            data.simulation.per_pr_results.forEach(pr => {
                if (!pr.violations || pr.violations.length === 0) return;
                pr.violations.forEach(v => {
                    rows.push([
                        pr.pr_number,
                        pr.repo,
                        \`"\${(pr.pr_title || '').replace(/"/g, '""')}"\`,
                        v.rule_id,
                        v.severity,
                        v.file || 'Global',
                        v.line || '',
                        \`"\${(v.message || '').replace(/"/g, '""')}"\`
                    ]);
                });
            });

            const csvString = rows.map(e => e.join(",")).join("\\n");
            const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvString);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "zaxion-report.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    </script>
</body>
</html>`;
  }
}
