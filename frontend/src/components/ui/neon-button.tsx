import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'neon' | 'glass';
  color?: 'cyan' | 'purple' | 'pink';
  glow?: boolean;
  asChild?: boolean;
  // Motion props (optional)
  whileHover?: any;
  whileTap?: any;
  initial?: any;
  animate?: any;
  transition?: any;
}

export const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(({
  children,
  className,
  variant = 'neon',
  color = 'cyan',
  glow = true,
  asChild = false,
  whileHover,
  whileTap,
  initial,
  animate,
  transition,
  ...props
}, ref) => {
  const Component = asChild ? Slot : motion.button;
  
  const colorMap = {
    cyan: 'bg-neon-cyan border-neon-cyan text-black shadow-neon-cyan',
    purple: 'bg-neon-purple border-neon-purple text-white shadow-neon-purple',
    pink: 'bg-neon-pink border-neon-pink text-white shadow-neon-pink',
  };

  const glassColorMap = {
    cyan: 'border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10',
    purple: 'border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10',
    pink: 'border-neon-pink/50 text-neon-pink hover:bg-neon-pink/10',
  };

  const defaultMotionProps = asChild ? {} : {
    whileHover: whileHover || { scale: 1.05 },
    whileTap: whileTap || { scale: 0.95 }
  };

  return (
    <Component
      ref={ref}
      className={cn(
        "px-8 py-3 rounded-full font-bold transition-all duration-300 border-2 inline-flex items-center justify-center",
        variant === 'neon' ? colorMap[color] : cn("bg-transparent", glassColorMap[color]),
        glow && variant === 'neon' && "hover:brightness-110",
        className
      )}
      {...defaultMotionProps}
      {...(props as any)}
    >
      {children}
    </Component>
  );
});

NeonButton.displayName = "NeonButton";
