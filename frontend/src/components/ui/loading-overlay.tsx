import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Shield } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message = "Authenticating with Institutional Registry..." }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#020617]/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative h-16 w-16 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                <Shield className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="absolute -bottom-1 -right-1">
                <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
              </div>
            </div>
            
            <div className="space-y-2 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-400 animate-pulse">
                {message}
              </p>
              <div className="flex gap-1 justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                    className="h-1 w-1 rounded-full bg-indigo-500"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 
