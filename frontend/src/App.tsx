import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import Waitlist from "./pages/Waitlist";
import DecisionResolutionConsole from "./pages/DecisionResolutionConsole";
import GovernanceDashboard from "./pages/GovernanceDashboard";
import DocsLayout from "./components/docs/DocsLayout";
import DocsOverview from "./pages/docs/Overview";
import DocsConstitution from "./pages/docs/Constitution";
import DocsPolicies from "./pages/docs/Policies";
import DocsSecurity from "./pages/docs/Security";
import DocsDeterministicEvaluation from "./pages/docs/DeterministicEvaluation";
import DocsASTAnalysis from "./pages/docs/ASTAnalysis";
import DocsRiskModel from "./pages/docs/RiskModel";
import DocsEnforcementLifecycle from "./pages/docs/EnforcementLifecycle";
import DocsGithubIntegration from "./pages/docs/implementation/GithubIntegration";
import DocsPolicyConfiguration from "./pages/docs/implementation/PolicyConfiguration";
import DocsOverrideProtocol from "./pages/docs/implementation/OverrideProtocol";
import DocsAuditTrail from "./pages/docs/AuditTrail";
import DocsSignedOverrides from "./pages/docs/SignedOverrides";
import NotFound from "./pages/NotFound";

const WorkspaceRedirect = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const pr = searchParams.get('pr');

  if (owner && repo && pr) {
    return <Navigate to={`/pr/${owner}/${repo}/${pr}`} replace />;
  }
  return <Navigate to="/" replace />;
};

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/pr/:owner/:repo/:prNumber" element={<DecisionResolutionConsole />} />
              <Route path="/workspace" element={<WorkspaceRedirect />} />
              <Route path="/governance" element={<GovernanceDashboard />} />
              
              {/* Documentation Ecosystem */}
              <Route path="/docs" element={<DocsLayout />}>
                <Route index element={<DocsOverview />} />
                <Route path="overview" element={<DocsOverview />} />
                <Route path="constitution" element={<DocsConstitution />} />
                <Route path="policies" element={<DocsPolicies />} />
                <Route path="security" element={<DocsSecurity />} />
                <Route path="deterministic-evaluation" element={<DocsDeterministicEvaluation />} />
                <Route path="ast-analysis" element={<DocsASTAnalysis />} />
                <Route path="risk-model" element={<DocsRiskModel />} />
                <Route path="enforcement-lifecycle" element={<DocsEnforcementLifecycle />} />
                <Route path="implementation/github-integration" element={<DocsGithubIntegration />} />
                <Route path="implementation/policy-configuration" element={<DocsPolicyConfiguration />} />
                <Route path="implementation/override-protocol" element={<DocsOverrideProtocol />} />
                <Route path="audit-trail" element={<DocsAuditTrail />} />
                <Route path="signed-overrides" element={<DocsSignedOverrides />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
