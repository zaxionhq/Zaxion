import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

interface NeonButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'neon' | 'glass';
  color?: 'cyan' | 'purple' | 'pink';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  asChild?: boolean;
}

export const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(({
  children,
  className,
  variant = 'neon',
  color = 'cyan',
  size = 'md',
  glow = true,
  asChild = false,
  whileHover,
  whileTap,
  initial,
  animate,
  transition,
  ...props
}, ref) => {
  const sizeMap = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-8 py-3 text-base',
    lg: 'px-10 py-4 text-lg',
  };

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

  const classes = cn(
    "rounded-full font-bold transition-all duration-300 border-2 inline-flex items-center justify-center",
    sizeMap[size],
    variant === 'neon' ? colorMap[color] : cn("bg-transparent", glassColorMap[color]),
    glow && variant === 'neon' && "hover:brightness-110",
    className
  );

  if (asChild) {
       return (
         <Slot ref={ref} className={classes} {...(props as unknown as React.ComponentPropsWithoutRef<'button'>)}>
           {children as React.ReactNode}
         </Slot>
       );
     }

  return (
    <motion.button
      ref={ref}
      className={classes}
      whileHover={whileHover || { scale: 1.05 }}
      whileTap={whileTap || { scale: 0.95 }}
      initial={initial}
      animate={animate}
      transition={transition}
      {...props}
    >
      {children}
    </motion.button>
  );
});

NeonButton.displayName = "NeonButton";
