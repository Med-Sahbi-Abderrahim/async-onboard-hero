import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import App from "./App.tsx";
import { ErrorFallback } from "./components/ErrorFallback";
import "./index.css";

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary 
    FallbackComponent={ErrorFallback}
    onError={(error, errorInfo) => {
      // Log to console in development
      console.error('Error caught by global boundary:', error, errorInfo);
      
      // In production, you could send to error tracking service
      // e.g., Sentry, LogRocket, etc.
    }}
  >
    <App />
  </ErrorBoundary>
);
