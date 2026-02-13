import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Github, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { NeonButton } from '@/components/ui/neon-button';
import { GlassCard } from '@/components/ui/glass-card';
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
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-neon-cyan animate-spin" />
        <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em]">Synchronizing Identity...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-neon-cyan/30 overflow-hidden flex items-center justify-center p-6 relative">
      {/* Background depth layers */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-cyan/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 radial-bg opacity-50" />
      </div>

      <div className="absolute top-8 left-8 z-10">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <img src="/zaxion-full.png" alt="Zaxion" className="h-12 w-auto object-contain brightness-0 invert group-hover:opacity-80 transition-opacity" />
        </div>
      </div>

      <GlassCard className="max-w-md w-full p-8 md:p-12 relative z-10 border-white/10 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="w-20 h-20 rounded-2xl glass-panel border-white/10 flex items-center justify-center shadow-neon-cyan/20 shadow-lg">
            <Shield className="h-10 w-10 text-neon-cyan" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-tight">Institutional Access</h2>
            <p className="text-white/40 text-sm leading-relaxed font-medium">
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

          <div className="pt-4 flex flex-col items-center gap-4 border-t border-white/5 w-full">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
              Secure SSO via GitHub OAuth
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/waitlist')}
                className="text-xs font-bold text-white/40 hover:text-neon-cyan transition-colors"
              >
                Request Beta Access
              </button>
              <span className="text-white/10">•</span>
              <button 
                onClick={() => navigate('/')}
                className="text-xs font-bold text-white/40 hover:text-neon-cyan transition-colors"
              >
                Protocol Overview
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="fixed bottom-12 left-0 right-0 z-10 text-center pointer-events-none">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/10">
          Zaxion Identity Provider • Zero Trust Architecture
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
