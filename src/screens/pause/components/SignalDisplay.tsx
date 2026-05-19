import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanionError } from './CompanionError';

interface Props {
  title: string;
  body: string;
  source: string;
  /** Canonical first-publication URL — prioritized over any mirror upstream. */
  url: string;
}

interface SignalDisplayProps {
  signal: Props | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
}

export function SignalDisplay({ signal, loading, error, onRetry }: SignalDisplayProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  if (error) {
    return <CompanionError companionType="signal" onRetry={onRetry} />;
  }
  if (!signal) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium leading-snug">{signal.title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{signal.body}</p>
      <a
        href={signal.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[10px] font-sans font-medium text-nox-text-link/75 hover:text-nox-text-link transition-colors"
      >
        <ExternalLink className="h-2.5 w-2.5" />
        {signal.source}
      </a>
    </div>
  );
}
