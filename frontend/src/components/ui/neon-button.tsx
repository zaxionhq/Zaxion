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
    cyan: 'bg-foreground border-foreground text-background shadow-elegant',
    purple: 'bg-foreground border-foreground text-background shadow-elegant',
    pink: 'bg-foreground border-foreground text-background shadow-elegant',
  };

  const glassColorMap = {
    cyan: 'border-border text-foreground hover:bg-foreground/5',
    purple: 'border-border text-foreground hover:bg-foreground/5',
    pink: 'border-border text-foreground hover:bg-foreground/5',
  };

  const classes = cn(
    "rounded-full font-bold transition-all duration-300 border-2 inline-flex items-center justify-center",
    sizeMap[size],
    variant === 'neon' ? colorMap[color] : cn("bg-transparent", glassColorMap[color]),
    glow && variant === 'neon' && "hover:brightness-95",
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
