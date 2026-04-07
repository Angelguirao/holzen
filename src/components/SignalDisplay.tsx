import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanionError } from './CompanionError';

interface Props {
  title: string;
  body: string;
  source: string;
  url: string;
  /** First-publication URL when `url` is a syndicated mirror */
  originalUrl?: string;
  originalPublication?: string;
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

  if (error || !signal) {
    return <CompanionError companionType="signal" onRetry={onRetry} />;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium leading-snug">{signal.title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{signal.body}</p>
      <a
        href={signal.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
      >
        <ExternalLink className="h-2.5 w-2.5" />
        {signal.source}
      </a>
      {signal.originalUrl && (
        <a
          href={signal.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[10px] text-muted-foreground/90 hover:text-muted-foreground leading-snug"
        >
          {signal.originalPublication
            ? `Originally published — ${signal.originalPublication}`
            : 'Originally published'}
          <span className="font-mono text-primary/60 ml-1 break-all">{signal.originalUrl}</span>
        </a>
      )}
    </div>
  );
}
