import React from 'react';
import { Loader2, Brain, Code2, GitBranch, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'ai' | 'code' | 'github' | 'file' | 'sparkle';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const iconMap = {
  default: Loader2,
  ai: Brain,
  code: Code2,
  github: GitBranch,
  file: FileText,
  sparkle: Sparkles,
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  variant = 'default',
}) => {
  const Icon = iconMap[variant];
  const sizeClass = sizeClasses[size];

  return (
    <Icon
      role="img"
      className={cn(
        'animate-spin text-primary',
        sizeClass,
        className
      )}
    />
  );
};

interface LoadingStateProps {
  message?: string;
  description?: string;
  variant?: 'default' | 'ai' | 'code' | 'github' | 'file' | 'sparkle';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  description,
  variant = 'default',
  size = 'lg',
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8', className)}>
      <div className="relative mb-4">
        {variant === 'ai' && (
          <div className="absolute inset-0 rounded-full bg-ai-gradient animate-pulse opacity-20" />
        )}
        <LoadingSpinner variant={variant} size={size} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{message}</h3>
      {description && (
        <p className="text-muted-foreground text-center max-w-md">{description}</p>
      )}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  description?: string;
  variant?: 'default' | 'ai' | 'code' | 'github' | 'file' | 'sparkle';
  children: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message,
  description,
  variant = 'default',
  children,
  className,
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <LoadingState
          message={message}
          description={description}
          variant={variant}
        />
      </div>
    </div>
  );
};

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'default' | 'ai' | 'code' | 'github' | 'file' | 'sparkle';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  variant = 'default',
  disabled,
  className,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'px-4 py-2 rounded-md font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading && <LoadingSpinner size="sm" variant={variant} />}
      {loading ? loadingText || 'Loading...' : children}
    </button>
  );
};

