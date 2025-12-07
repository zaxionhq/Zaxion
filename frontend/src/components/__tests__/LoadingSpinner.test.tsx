import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner, LoadingState, LoadingOverlay, LoadingButton } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('h-4', 'w-4');

    rerender(<LoadingSpinner size="md" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('h-6', 'w-6');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('h-8', 'w-8');

    rerender(<LoadingSpinner size="xl" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('h-12', 'w-12');
  });

  it('should render with different variants', () => {
    const { rerender } = render(<LoadingSpinner variant="ai" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('animate-spin');

    rerender(<LoadingSpinner variant="code" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('animate-spin');

    rerender(<LoadingSpinner variant="github" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('animate-spin');
  });

  it('should apply custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('custom-class');
  });
});

describe('LoadingState', () => {
  it('should render with default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with custom message and description', () => {
    render(
      <LoadingState
        message="Custom Loading"
        description="This is a custom loading description"
      />
    );
    expect(screen.getByText('Custom Loading')).toBeInTheDocument();
    expect(screen.getByText('This is a custom loading description')).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<LoadingState variant="ai" />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();

    rerender(<LoadingState variant="code" />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();

    rerender(<LoadingState variant="github" />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<LoadingState className="custom-loading" />);
    const container = screen.getByText('Loading...').closest('div');
    expect(container).toHaveClass('custom-loading');
  });
});

describe('LoadingOverlay', () => {
  it('should render children when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div data-testid="content">Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('should render loading overlay when loading', () => {
    render(
      <LoadingOverlay isLoading={true} message="Loading content">
        <div data-testid="content">Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Loading content')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('should render with custom loading message and description', () => {
    render(
      <LoadingOverlay
        isLoading={true}
        message="Custom Loading"
        description="Loading description"
      >
        <div data-testid="content">Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Custom Loading')).toBeInTheDocument();
    expect(screen.getByText('Loading description')).toBeInTheDocument();
  });
});

describe('LoadingButton', () => {
  it('should render button with children when not loading', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('should render loading state when loading', () => {
    render(<LoadingButton loading={true}>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toHaveTextContent('Loading...');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should render custom loading text', () => {
    render(
      <LoadingButton loading={true} loadingText="Processing...">
        Click me
      </LoadingButton>
    );
    expect(screen.getByRole('button')).toHaveTextContent('Processing...');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should be disabled when loading', () => {
    render(<LoadingButton loading={true}>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<LoadingButton disabled={true}>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<LoadingButton variant="ai" loading={true}>AI Loading</LoadingButton>);
    expect(screen.getByRole('button')).toHaveTextContent('Loading...');

    rerender(<LoadingButton variant="code" loading={true}>Code Loading</LoadingButton>);
    expect(screen.getByRole('button')).toHaveTextContent('Loading...');

    rerender(<LoadingButton variant="github" loading={true}>GitHub Loading</LoadingButton>);
    expect(screen.getByRole('button')).toHaveTextContent('Loading...');
  });

  it('should apply custom className', () => {
    render(<LoadingButton className="custom-button">Click me</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('custom-button');
  });

  it('should handle click events when not loading', () => {
    const handleClick = vi.fn();
    render(<LoadingButton onClick={handleClick}>Click me</LoadingButton>);
    
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not handle click events when loading', () => {
    const handleClick = vi.fn();
    render(<LoadingButton loading={true} onClick={handleClick}>Click me</LoadingButton>);
    
    screen.getByRole('button').click();
    expect(handleClick).not.toHaveBeenCalled();
  });
});

