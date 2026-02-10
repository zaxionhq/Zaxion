import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  ArrowRight, 
  Lock, 
  CheckCircle2, 
  Mail,
  ArrowLeft
} from 'lucide-react';
import { NeonButton } from '@/components/ui/neon-button';
import { Input } from '@/components/ui/input';

const Waitlist = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Here you would typically send the email to your backend/service
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-neon-cyan/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background depth layers */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-cyan/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 radial-bg opacity-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <div 
          className="inline-flex items-center gap-2 mb-12 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <img src="/zaxion-full.png" alt="Zaxion" className="h-12 w-auto object-contain brightness-0 invert group-hover:opacity-80 transition-opacity" />
        </div>

        {!submitted ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Early access to <br />
                <span className="gradient-text">deterministic PR governance.</span>
              </h1>
              <p className="text-white/40 text-sm font-medium">
                Zaxion is currently in a restricted, invite-only phase for senior engineering teams.
              </p>
            </div>

            <div className="space-y-4 py-8 border-y border-white/5">
              {[
                "Invite-only beta for design partners",
                "Built for senior engineering teams",
                "Deterministic, auditable decisions"
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-3 text-left">
                  <div className="h-5 w-5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-neon-cyan" />
                  </div>
                  <span className="text-sm font-bold text-white/60">{point}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-neon-cyan transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <Input 
                  type="email" 
                  placeholder="Engineering email address" 
                  className="pl-12 h-14 bg-white/[0.02] border-white/10 focus:border-neon-cyan/50 focus:ring-neon-cyan/20 transition-all rounded-xl text-sm font-medium"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <NeonButton color="cyan" size="lg" className="w-full h-14 rounded-xl text-sm font-black tracking-widest uppercase">
                Request Early Access
              </NeonButton>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                We’ll reach out personally. No marketing spam.
              </p>
            </form>
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-12 rounded-[2.5rem] glass-panel border-white/10 space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-neon-cyan" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Request Received</h2>
            <p className="text-white/40 text-sm leading-relaxed">
              We have recorded your interest. Our team filters for architectural fit and will reach out if we see a match for the current design partner cohort.
            </p>
            <NeonButton variant="glass" color="cyan" className="w-full" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Landing
            </NeonButton>
          </motion.div>
        )}
      </motion.div>

      <div className="fixed bottom-12 left-0 right-0 z-10 text-center">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/10">
          Zaxion Governance Protocol • Phase 7 Stability
        </p>
      </div>
    </div>
  );
};

export default Waitlist;
