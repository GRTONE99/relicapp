import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// React Error Boundaries must be class components — there is no hook equivalent
// for catching render-phase exceptions. This boundary catches any error thrown
// inside the subtree and renders a recoverable fallback instead of a blank screen.

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);

    // Stale chunk errors after a new deploy — browser cached a chunk URL that
    // no longer exists on the server. Chrome reports "Failed to fetch dynamically
    // imported module"; Safari reports "'text/html' is not a valid JavaScript
    // MIME type" (server returned a 404 HTML page instead of JS).
    const isStaleChunk =
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("is not a valid JavaScript MIME type");
    if (isStaleChunk) {
      window.location.reload();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              An unexpected error occurred. Your collection data is safe — this is a display error
              only.
            </p>
          </div>

          {this.state.error && (
            <div className="rounded-lg bg-muted/50 border border-border p-4 text-left">
              <p className="text-xs font-mono text-muted-foreground break-all">
                {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button onClick={() => window.location.assign("/")}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
