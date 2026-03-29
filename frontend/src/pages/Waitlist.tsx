import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Mail,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { NeonButton } from '@/components/ui/neon-button';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const Waitlist = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // API client now handles CSRF token retrieval automatically
      await api.post('/v1/waitlist', { email });
      setSubmitted(true);
      toast.success('Registration verified. Welcome to the protocol.');
    } catch (err) {
      const error = err as ApiError;
      console.error('Waitlist Error:', error);
      toast.error(error.message || 'Protocol failure. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-neon-cyan/30 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
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

      <div className="relative z-10 w-full max-w-md text-center">
        {!submitted ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-foreground">
                Join the <br />
                <span className="gradient-text">Zaxion Waitlist.</span>
              </h1>
              <p className="text-muted-foreground text-sm font-medium">
                Designed for security and platform teams implementing deterministic PR governance.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground/20 group-focus-within:text-neon-cyan transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <Input 
                  type="email" 
                  placeholder="Engineering email address" 
                  className="pl-12 h-14 bg-card/50 border-border focus:border-neon-cyan/50 focus:ring-neon-cyan/20 transition-all rounded-xl text-sm font-medium"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <NeonButton 
                color="cyan" 
                size="lg" 
                className="w-full h-14 rounded-xl text-sm font-black tracking-widest uppercase"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Join Waitlist'
                )}
              </NeonButton>
              
              <div className="pt-6 grid grid-cols-2 gap-4 border-t border-border">
                {[
                  { label: 'Security Protocols', count: '31+' },
                  { label: 'Platform Ready', count: '100%' }
                ].map((item, i) => (                    <div key={i} className="text-center space-y-1">
                    <span className="block text-xl font-black text-foreground">{item.count}</span>
                    <span className="block text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 rounded-2xl glass-panel border-border flex items-center justify-center mx-auto shadow-neon-cyan/20 shadow-lg">
              <Shield className="h-10 w-10 text-neon-cyan" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tight text-foreground">Protocol Accepted.</h2>
              <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                We've verified your registration. Your engineering identity is now queued for early institutional access.
              </p>
            </div>
            <NeonButton 
              variant="glass" 
              color="cyan" 
              className="px-8"
              onClick={() => navigate('/')}
            >
              Return to Command
            </NeonButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default Waitlist;
