"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  retryLabel?: string;
  homeHref?: string;
  homeLabel?: string;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <h2 className="text-lg font-semibold">{this.props.title ?? "Something went wrong"}</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.props.description ?? "Please try again or return to a safe page."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" onClick={() => this.setState({ error: null })}>
              {this.props.retryLabel ?? "Try again"}
            </Button>
            {this.props.homeHref && (
              <Link
                href={this.props.homeHref}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-input bg-background px-3 text-sm font-medium"
              >
                {this.props.homeLabel ?? "Go back"}
              </Link>
            )}
            <Button type="button" variant="ghost" onClick={() => window.location.reload()}>
              Refresh page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function SheetErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary
      title="Sheet failed to load"
      description="The spreadsheet encountered an error. Your data is safe — try reloading this sheet."
      homeHref="/"
      homeLabel="Return to workspace"
    >
      {children}
    </AppErrorBoundary>
  );
}

export function WorkspaceErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary
      title="Workspace unavailable"
      description="We could not load this workspace. Check your connection and try again."
      homeHref="/"
      homeLabel="Home"
    >
      {children}
    </AppErrorBoundary>
  );
}

export function ImportErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary
      title="Import failed"
      description="Something went wrong during import. You can retry or choose a different file."
      retryLabel="Retry import"
    >
      {children}
    </AppErrorBoundary>
  );
}
