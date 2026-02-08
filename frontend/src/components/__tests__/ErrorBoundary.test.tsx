import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, useErrorHandler } from '../ErrorBoundary';

// Helper component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock component that uses the error handler hook
const ComponentWithErrorHandler = () => {
  const { error, handleError, clearError } = useErrorHandler();

  return (
    <div>
      {error && <div data-testid="error-message">{error.message}</div>}
      <button
        data-testid="trigger-error"
        onClick={() => handleError(new Error('Async error'))}
      >
        Trigger Error
      </button>
      <button data-testid="clear-error" onClick={clearError}>
        Clear Error
      </button>
    </div>
  );
};

describe('ErrorBoundary', () => {
  const originalError = console.error;
  const originalLocation = window.location;

  beforeEach(() => {
    // Suppress console.error in tests as we expect errors
    console.error = vi.fn();
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: 'http://localhost/' },
      writable: true,
    });
  });

  afterEach(() => {
    console.error = originalError;
    vi.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should not show error details in production mode', () => {
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it('should render custom fallback when provided', () => {
    const Fallback = () => <div>Custom Fallback</div>;
    render(
      <ErrorBoundary fallback={<Fallback />}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
  });

  it('should retry when retry button is clicked', () => {
    // Simpler fix: use a wrapper component that changes the state
    const Wrapper = () => {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <div onClick={() => setShouldThrow(false)}>
          <ErrorBoundary>
            <ThrowError shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>
      );
    };

    render(<Wrapper />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change the state first so that when we retry, it doesn't throw again
    fireEvent.click(screen.getByText('Something went wrong').parentElement!.parentElement!.parentElement!);
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should go home when go home button is clicked', () => {
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Go Home'));

    expect(mockLocation.href).toBe('/');
  });
});

describe('useErrorHandler', () => {
  it('should handle async errors', () => {
    render(<ComponentWithErrorHandler />);

    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('trigger-error'));

    expect(screen.getByTestId('error-message')).toHaveTextContent('Async error');
  });

  it('should clear errors', () => {
    render(<ComponentWithErrorHandler />);

    fireEvent.click(screen.getByTestId('trigger-error'));
    expect(screen.getByTestId('error-message')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('clear-error'));
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });
});

