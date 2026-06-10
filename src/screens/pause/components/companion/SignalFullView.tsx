import { Clock, ExternalLink, Landmark, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { estimateReadTime } from '@/features/pause/public-ritual-frame';
import { cn } from '@/lib/utils';
import { CompanionError } from '../CompanionError';
import { WhyThisCard } from './WhyThisCard';
import { SignalKeyIdeasBlock } from '@/screens/pause/components/companion/signal-key-ideas-block';
import { normalizeSignalKeyIdeas, type SignalPayload } from '@/features/pause/public-ritual-frame';

type SignalData = SignalPayload;

interface Props {
  signal: SignalData | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
  mood?: string | null;
  marketDirection?: 'up' | 'down' | 'neutral' | null;
  preferredBias?: string | null;
  host?: string | null;
  isTrusted?: boolean | null;
}

/**
 * Full-page Signal presentation (Figma Lore full-view → product name Signal).
 *
 * Hierarchy: read time → hero icon → title + byline → body → KEY IDEAS panel → source link.
 */
export function SignalFullView({
  signal,
  loading,
  error,
  onRetry,
  mood,
  marketDirection,
  preferredBias,
  host = null,
  isTrusted = null,
}: Props) {
  "use memo";
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="mx-auto h-4 w-24" />
        <Skeleton className="mx-auto h-8 w-8 rounded-md" />
        <Skeleton className="h-6 w-4/5 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !signal) {
    return <CompanionError companionType="signal" onRetry={onRetry} />;
  }

  const bodyChars = signal.title.length + signal.body.length + signal.source.length;
  const est = estimateReadTime(bodyChars);
  const readLabel =
    est.kind === 'glance'
      ? t('companions.fullview.readTime.glance')
      : est.kind === 'thirty'
        ? t('companions.fullview.readTime.thirty')
        : est.kind === 'ninety'
          ? t('companions.fullview.readTime.ninety')
          : t('companions.fullview.readTime.minutes', { n: est.minutes });

  const keyIdeas = normalizeSignalKeyIdeas({ body: signal.body, keyIdeas: signal.keyIdeas });

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        <div className="inline-flex items-center justify-center gap-1 text-sm leading-6 text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
          <span>{readLabel}</span>
        </div>

        <Landmark className="h-8 w-8 text-foreground" aria-hidden />

        <div className="w-full space-y-1 text-center">
          {signal.title ? (
            <p className="text-base font-medium leading-6 tracking-wide text-foreground">{signal.title}</p>
          ) : null}
          {signal.source ? (
            <p className="text-base italic leading-6 text-muted-foreground">{signal.source}</p>
          ) : null}
        </div>
      </div>

      <p className="whitespace-pre-line text-sm leading-5 tracking-wide text-foreground">{signal.body}</p>

      <SignalKeyIdeasBlock keyIdeas={keyIdeas} variant="wireframe" />

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <WhyThisCard
          companion="signal"
          mood={mood}
          marketDirection={marketDirection}
          preferredBias={preferredBias}
          className="ml-0"
        />
      </div>

      {signal.url ? (
        <div className="space-y-2 border-t border-border/20 pt-4">
          {host ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <img
                src={`https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(host)}`}
                alt=""
                width={16}
                height={16}
                loading="lazy"
                className="h-4 w-4 rounded-sm"
                aria-hidden
              />
              <span className="text-xs font-mono text-muted-foreground/70">{host}</span>
              {isTrusted === true ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-1.5 py-[2px] text-[9px] font-mono text-muted-foreground"
                >
                  <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                  {t('companions.fullview.signal.trusted')}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="flex justify-center">
            <a
              href={signal.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors',
              )}
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
              {signal.source || t('companions.fullview.signal.readSource')}
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
