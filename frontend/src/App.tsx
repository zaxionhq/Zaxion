import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import ResolutionPage from "./pages/ResolutionPage";
import ExperimentalIDE from "./pages/ExperimentalIDE";
import OAuthCallback from "./pages/OAuthCallback";
import ArchitecturePage from "./pages/ArchitecturePage";
import GovernanceDashboard from "./pages/GovernanceDashboard";
import NotFound from "./pages/NotFound";

const InternalProtection = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isInternal = params.get('internal') === 'true';

  if (!isInternal) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
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
              <Route path="/resolution/:decisionId" element={<ResolutionPage />} />
              <Route 
                path="/_experimental" 
                element={
                  <InternalProtection>
                    <ExperimentalIDE />
                  </InternalProtection>
                } 
              />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/architecture" element={<ArchitecturePage />} />
              <Route path="/workspace" element={<ExperimentalIDE />} />
              <Route path="/governance" element={<GovernanceDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
