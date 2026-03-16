import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import React, { Suspense, lazy } from 'react';
import { Loader2 } from "lucide-react";

// Lazy Load Pages for Performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DecisionResolutionConsole = lazy(() => import("./pages/DecisionResolutionConsole"));
const GovernanceDashboard = lazy(() => import("./pages/GovernanceDashboard"));
const GovernanceDecisions = lazy(() => import("./pages/GovernanceDecisions"));
const GovernanceAnalytics = lazy(() => import("./pages/GovernanceAnalytics"));
const GovernanceSettings = lazy(() => import("./pages/GovernanceSettings"));
const GovernancePolicyLibrary = lazy(() => import("./pages/GovernancePolicyLibrary"));
const GovernanceCorePolicies = lazy(() => import("./pages/GovernanceCorePolicies"));

// Documentation Pages Lazy Load
const DocsLayout = lazy(() => import("./components/docs/DocsLayout"));
const DocsOverview = lazy(() => import("./pages/docs/Overview"));
const DocsGettingStarted = lazy(() => import("./pages/docs/GettingStarted"));
const DocsQuickStart = lazy(() => import("./pages/docs/QuickStart"));
const DocsUseCases = lazy(() => import("./pages/docs/UseCases"));
const DocsExamples = lazy(() => import("./pages/docs/Examples"));
const DocsFAQ = lazy(() => import("./pages/docs/FAQ"));
const DocsTroubleshooting = lazy(() => import("./pages/docs/Troubleshooting"));
const DocsConstitution = lazy(() => import("./pages/docs/Constitution"));
const DocsPolicies = lazy(() => import("./pages/docs/Policies"));
const DocsRuleTypes = lazy(() => import("./pages/docs/RuleTypes"));
const DocsSecurity = lazy(() => import("./pages/docs/Security"));
const DocsDeterministicEvaluation = lazy(() => import("./pages/docs/DeterministicEvaluation"));
const DocsASTAnalysis = lazy(() => import("./pages/docs/ASTAnalysis"));
const DocsRiskModel = lazy(() => import("./pages/docs/RiskModel"));
const DocsEnforcementLifecycle = lazy(() => import("./pages/docs/EnforcementLifecycle"));
const DocsGithubIntegration = lazy(() => import("./pages/docs/implementation/GithubIntegration"));
const DocsPolicyConfiguration = lazy(() => import("./pages/docs/implementation/PolicyConfiguration"));
const DocsOverrideProtocol = lazy(() => import("./pages/docs/implementation/OverrideProtocol"));
const DocsAuditTrail = lazy(() => import("./pages/docs/AuditTrail"));
const DocsSignedOverrides = lazy(() => import("./pages/docs/SignedOverrides"));
const DocsPrivacyPolicy = lazy(() => import("./pages/docs/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                {/* <Route path="/waitlist" element={<Waitlist />} /> */}
                <Route path="/pr/:owner/:repo/:prNumber" element={<DecisionResolutionConsole />} />
                <Route path="/workspace" element={<WorkspaceRedirect />} />
                <Route path="/governance" element={<GovernanceDashboard />} />
                <Route path="/governance/decisions" element={<GovernanceDecisions />} />
                <Route path="/governance/analytics" element={<GovernanceAnalytics />} />
                <Route path="/governance/policy-library" element={<GovernancePolicyLibrary />} />
                <Route path="/governance/core-policies" element={<GovernanceCorePolicies />} />
                <Route path="/governance/settings" element={<GovernanceSettings />} />
                
                {/* Documentation Ecosystem */}
                <Route path="/docs" element={<DocsLayout />}>
                  <Route index element={<DocsGettingStarted />} />
                  <Route path="getting-started" element={<DocsGettingStarted />} />
                  <Route path="quick-start" element={<DocsQuickStart />} />
                  <Route path="use-cases" element={<DocsUseCases />} />
                  <Route path="examples" element={<DocsExamples />} />
                  <Route path="faq" element={<DocsFAQ />} />
                  <Route path="troubleshooting" element={<DocsTroubleshooting />} />
                  <Route path="overview" element={<DocsOverview />} />
                  <Route path="constitution" element={<DocsConstitution />} />
                  <Route path="policies" element={<DocsPolicies />} />
                  <Route path="rules" element={<DocsRuleTypes />} />
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
                  <Route path="privacy" element={<DocsPrivacyPolicy />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
