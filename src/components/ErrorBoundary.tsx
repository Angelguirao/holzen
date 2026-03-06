import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
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
                onClick={() => { window.location.href = '/'; }}
                className="block mx-auto text-xs font-mono text-muted-foreground underline"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
