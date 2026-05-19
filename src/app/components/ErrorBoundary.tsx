import { Component, type ErrorInfo, type ReactNode } from 'react';
import { captureException, Sentry } from '@/lib/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  /** Sentry event id from the latest capture — pivots Sentry → user feedback. */
  eventId: string;
  /** Short error message used in the feedback sheet title (never full stack). */
  errorMessage: string;
}

/**
 * Shape of the payload dispatched on `holzen:open-feedback` when the user clicks
 * "Report this". `FeedbackWidget` mounts a listener and pre-fills its sheet with
 * this context so the report carries the Sentry event id + component stack anchor.
 *
 * Keep this in sync with src/app/components/FeedbackWidget.tsx.
 */
export interface OpenFeedbackDetail {
  source: 'error-boundary' | 'manual';
  sentryEventId?: string;
  errorMessage?: string;
  errorStack?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, eventId: '', errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      eventId: '',
      errorMessage: error?.message?.slice(0, 200) ?? 'Unknown error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);

    // Sentry React SDK exposes `withScope` — attach the componentStack as a separate
    // context block so the issue groups on the real exception rather than the boundary.
    let eventId = '';
    try {
      Sentry.withScope((scope) => {
        scope.setContext('react', { componentStack: info.componentStack });
        scope.setTag('boundary', 'root');
        eventId = Sentry.captureException(error);
      });
    } catch {
      eventId = captureException(error, { componentStack: info.componentStack });
    }

    if (eventId) this.setState({ eventId });

    // Stash last error details for the feedback widget — the component unmounts on reset
    // so we cannot rely on state alone.
    this.lastError = error;
  }

  private lastError: Error | null = null;

  handleReset = () => {
    this.setState({ hasError: false, eventId: '', errorMessage: '' });
    this.lastError = null;
  };

  handleGoHome = () => {
    this.setState({ hasError: false, eventId: '', errorMessage: '' }, () => {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    this.lastError = null;
  };

  handleReport = () => {
    const detail: OpenFeedbackDetail = {
      source: 'error-boundary',
      sentryEventId: this.state.eventId || undefined,
      errorMessage: this.state.errorMessage || undefined,
      errorStack: this.lastError?.stack?.slice(0, 2000),
    };
    // FeedbackWidget listens for this and opens its sheet. If the widget isn't mounted
    // (e.g. crash before App boot), fall back to opening a mailto link via location.
    window.dispatchEvent(new CustomEvent<OpenFeedbackDetail>('holzen:open-feedback', { detail }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-xs space-y-6 text-center">
            <p className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
              Holzen
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Something went wrong. Take a breath, then try again.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.handleReset}
                className="block mx-auto text-xs font-mono text-muted-foreground underline"
              >
                Try again
              </button>
              <button
                onClick={this.handleGoHome}
                className="block mx-auto text-xs font-mono text-muted-foreground underline"
              >
                Go home
              </button>
              <button
                onClick={this.handleReport}
                className="block mx-auto text-xs font-mono text-muted-foreground underline"
              >
                Report this
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
