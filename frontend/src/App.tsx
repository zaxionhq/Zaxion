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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
