import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CompanionError } from './CompanionError';
import { SignalReadFullStoryButton } from '@/screens/pause/components/companion/signal-read-full-story-button';

export type SignalPayload = {
  title: string;
  body: string;
  source: string;
  /** Canonical first-publication URL — prioritized over any mirror upstream. */
  url: string;
};

export type SignalDisplayVariant = 'default' | 'frame';

interface SignalDisplayProps {
  signal: SignalPayload | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
  /** Frame accordion: title → byline → excerpt → purple full-story CTA. */
  variant?: SignalDisplayVariant;
  pauseInstanceId?: string | null;
}

function truncateExcerpt(body: string, maxChars = 220): string {
  const trimmed = body.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const slice = trimmed.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > maxChars * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

export function SignalDisplay({
  signal,
  loading,
  error,
  onRetry,
  variant = 'default',
  pauseInstanceId = null,
}: SignalDisplayProps) {
  "use memo";
  const isFrame = variant === 'frame';

  if (loading) {
    return (
      <div className={cn('space-y-2', isFrame && 'px-1 pt-4')}>
        <Skeleton className={cn(isFrame ? 'h-4 w-4/5' : 'h-4 w-3/4')} />
        {isFrame ? <Skeleton className="h-4 w-2/5" /> : null}
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(isFrame && 'px-1 pt-2')}>
        <CompanionError companionType="signal" onRetry={onRetry} />
      </div>
    );
  }

  if (!signal) return null;

  if (isFrame) {
    const excerpt = truncateExcerpt(signal.body);
    return (
      <div className="space-y-2 pt-2">
        {signal.title ? (
          <p className="text-sm font-medium leading-snug tracking-wide text-foreground">{signal.title}</p>
        ) : null}
        {signal.source ? (
          <p className="text-sm font-medium leading-snug tracking-wide text-muted-foreground">{signal.source}</p>
        ) : null}
        {excerpt ? (
          <p className="text-sm leading-relaxed tracking-wide text-foreground">{excerpt}</p>
        ) : null}
        {pauseInstanceId ? <SignalReadFullStoryButton pauseInstanceId={pauseInstanceId} /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2 py-3">
      {signal.title ? <p className="text-xs font-medium leading-snug text-foreground/90">{signal.title}</p> : null}
      {signal.body ? (
        <p className="text-xs text-muted-foreground leading-relaxed">{signal.body}</p>
      ) : null}
      {signal.url ? (
        <a
          href={signal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[10px] font-sans font-medium text-nox-text-link/75 hover:text-nox-text-link transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-2.5 w-2.5" aria-hidden />
          {signal.source}
        </a>
      ) : null}
    </div>
  );
}
