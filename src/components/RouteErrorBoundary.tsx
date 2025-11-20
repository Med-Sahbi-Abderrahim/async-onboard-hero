import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './ErrorFallback';
import { ReactNode } from 'react';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  routeName?: string;
}

/**
 * Reusable error boundary for individual routes
 * Provides isolated error handling so one route failure doesn't crash the entire app
 */
export function RouteErrorBoundary({ children, routeName }: RouteErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error(`Error in route ${routeName || 'unknown'}:`, error, errorInfo);
      }}
      onReset={() => {
        // Reset the route by reloading
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
