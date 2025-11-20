import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  // Log error to console for debugging
  console.error("Error caught by boundary:", error);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="max-w-lg w-full shadow-xl border-destructive/20">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto rounded-full bg-destructive/10 p-4 w-fit">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl mb-2">Something went wrong</CardTitle>
            <CardDescription className="text-base">
              We encountered an unexpected error. Don't worry, your data is safe.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error details in dev mode */}
          {import.meta.env.DEV && (
            <details className="bg-muted/50 rounded-lg p-4 text-sm">
              <summary className="cursor-pointer font-semibold text-muted-foreground mb-2">
                Technical Details (Dev Mode)
              </summary>
              <div className="space-y-2 mt-2">
                <p className="font-mono text-xs text-destructive break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="text-xs text-muted-foreground overflow-auto max-h-32 mt-2 whitespace-pre-wrap break-all">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={resetErrorBoundary}
              className="flex-1 gap-2"
              variant="default"
            >
              <RefreshCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={handleGoHome}
              className="flex-1 gap-2"
              variant="outline"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Help text */}
          <p className="text-sm text-center text-muted-foreground">
            If this problem persists, please contact support or try refreshing the page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
