import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Github, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { NeonButton } from '@/components/ui/neon-button';
import { GlassCard } from '@/components/ui/glass-card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSession } from '@/hooks/useSession';
import { api } from '@/lib/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: sessionLoading } = useSession();

  // If already logged in, redirect to the intended page or governance
  React.useEffect(() => {
    if (user && !sessionLoading) {
      const searchParams = new URLSearchParams(location.search);
      const redirect = searchParams.get('redirect') || '/governance';
      navigate(redirect, { replace: true });
    }
  }, [user, sessionLoading, navigate, location]);

  const handleGitHubLogin = () => {
    const searchParams = new URLSearchParams(location.search);
    const redirectUrl = searchParams.get('redirect') || '/governance';
    const url = api.buildUrl(`/v1/auth/github?redirect_url=${encodeURIComponent(redirectUrl)}`);
    window.location.href = url;
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-[0.2em]">Synchronizing Identity...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-neon-cyan/30 overflow-hidden flex items-center justify-center p-6 relative transition-colors duration-300">
      {/* Background depth layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/5 dark:bg-neon-purple/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-cyan/5 dark:bg-neon-cyan/10 blur-[120px] rounded-full animate-pulse delay-700" />
        <div className="absolute inset-0 radial-bg opacity-30 dark:opacity-50" />
      </div>

      <div className="absolute top-8 left-8 z-10 flex items-center gap-4">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <img src="/Zaxion landing page logo.png" alt="Zaxion" className="h-10 w-auto object-contain transition-transform duration-500 group-hover:scale-110" />
          <span className="text-xl font-black tracking-tighter hidden sm:block ml-1">
            ZAXION<span className="text-neon-cyan">.</span>
          </span>
        </div>
        <ThemeToggle />
      </div>

      <GlassCard className="max-w-md w-full p-8 md:p-12 relative z-10 border-border shadow-2xl bg-card/50">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 rounded-2xl glass-panel border-border flex items-center justify-center shadow-neon-cyan/20 shadow-lg">
            <Shield className="h-10 w-10 text-neon-cyan" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-foreground">Institutional Access</h2>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              Zaxion Governance Protocol requires a verified engineering identity. 
              Connect your GitHub account to proceed to the console.
            </p>
          </div>

          <NeonButton 
            color="cyan" 
            size="lg" 
            className="w-full h-14 rounded-xl text-sm font-black tracking-widest uppercase flex items-center justify-center gap-3"
            onClick={handleGitHubLogin}
          >
            <Github className="h-5 w-5" />
            Connect with GitHub
          </NeonButton>

          <div className="pt-4 flex flex-col items-center gap-4 border-t border-border w-full">
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
              Secure SSO via GitHub OAuth
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="text-xs font-bold text-muted-foreground hover:text-neon-cyan transition-colors"
              >
                Protocol Overview
              </button>
              <span className="text-border">•</span>
              <button 
                onClick={() => navigate('/docs')}
                className="text-xs font-bold text-muted-foreground hover:text-neon-cyan transition-colors"
              >
                Documentation
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="fixed bottom-12 left-0 right-0 z-10 text-center pointer-events-none">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-foreground/20">
          Zaxion Identity Provider • Zero Trust Architecture
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
