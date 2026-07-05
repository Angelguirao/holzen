import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CompanionError } from './CompanionError';
import type { SignalPayload } from '@/features/pause/public-ritual-frame';
import { SignalFrameDisplay } from '@/screens/pause/components/signal-frame-display';

export type { SignalPayload };

export type SignalDisplayVariant = 'default' | 'frame';

interface SignalDisplayProps {
  signal: SignalPayload | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
  variant?: SignalDisplayVariant;
  pauseInstanceId?: string | null;
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
      <div className={cn('space-y-2', isFrame && 'px-1')}>
        <Skeleton className={cn(isFrame ? 'mt-4 h-4 w-full' : 'h-4 w-3/4')} />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
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
    return <SignalFrameDisplay signal={signal} pauseInstanceId={pauseInstanceId} />;
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
