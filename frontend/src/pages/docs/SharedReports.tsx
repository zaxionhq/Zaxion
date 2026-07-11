import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Link2 } from 'lucide-react';
import DocsStep from '../../components/docs/DocsStep';

const SharedReports = () => (
  <div className="space-y-12 text-foreground">
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary uppercase tracking-wider">
        <Link2 className="h-3 w-3" />
        Sharing
      </div>
      <h1 className="text-4xl font-bold tracking-tight">Shared reports</h1>
      <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
        Share read-only snapshots of policy simulations and governance audits with anyone via a link — no login required
        for viewers.
      </p>
    </div>

    <section className="space-y-6">
      <DocsStep number="01" title="Create a share link">
        <p className="text-sm text-muted-foreground leading-relaxed">
          After running a <strong className="text-foreground">Policy Impact Simulation</strong> or generating an audit
          report, click <strong className="text-foreground">Copy Share Link</strong>. Choose link expiry: 1, 7, 30
          (default), or 90 days.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          All simulation input modes support sharing: repository history, GitHub PR URL, file upload, paste, and zip.
        </p>
      </DocsStep>

      <DocsStep number="02" title="What viewers see">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Shared links open at <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/reports/&lt;token&gt;</code> in
          <strong className="text-foreground"> read-only mode</strong>. Export and share controls are hidden. Policy
          simulation reports render as an interactive HTML snapshot; audit reports show the interactive or social receipt
          view depending on how you shared.
        </p>
      </DocsStep>

      <DocsStep number="03" title="Manage and revoke links">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Go to <Link to="/governance/settings" className="text-primary hover:underline">Governance Settings</Link> →
          <strong className="text-foreground"> Shared Reports</strong>. Copy active links, open them in a new tab, or
          revoke access. Revoked or expired links return an error to viewers.
        </p>
      </DocsStep>
    </section>

    <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-2">
      <h3 className="font-semibold flex items-center gap-2">
        <ExternalLink className="h-4 w-4 text-primary" />
        Privacy note
      </h3>
      <p className="text-sm text-muted-foreground">
        Anyone with the link can view the report until it expires or is revoked. Do not share links containing sensitive
        code or credentials in public channels. See{' '}
        <Link to="/docs/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  </div>
);

export default SharedReports;
