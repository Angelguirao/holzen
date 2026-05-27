import { Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { estimateReadTime } from '@/features/pause/public-ritual-frame';
import { cn } from '@/lib/utils';
import { CompanionError } from '../CompanionError';
import { WhyThisCard } from './WhyThisCard';

interface SignalData {
  title: string;
  body: string;
  source: string;
  /** Canonical first-publication URL. */
  url: string;
}

interface Props {
  signal: SignalData | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
  /** Passed through to `WhyThisCard`. Optional — disclosure renders null when all three are unknown. */
  mood?: string | null;
  marketDirection?: 'up' | 'down' | 'neutral' | null;
  preferredBias?: string | null;
  /** Normalized URL host for favicon + trusted badge (from `useSignalSourceTrustedHost`). */
  host?: string | null;
  /** From `useSignalSourceTrustedHost`; `null` while catalog loads or host unknown. */
  isTrusted?: boolean | null;
}

/**
 * Full-page Signal presentation (Figma Lore full-view → product name Signal).
 *
 * Hierarchy: read time → title → source byline → body → source link row with favicon.
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
        <Skeleton className="h-6 w-4/5 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="inline-flex items-center gap-1 text-sm text-muted-foreground" role="status">
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
          <span>{readLabel}</span>
        </div>
        <WhyThisCard
          companion="signal"
          mood={mood}
          marketDirection={marketDirection}
          preferredBias={preferredBias}
          className="ml-0"
        />
      </div>

      <div className="space-y-3 text-center">
        <h2 className="text-base font-medium leading-snug text-foreground">{signal.title}</h2>
        {signal.source ? (
          <p className="text-sm font-medium leading-snug text-muted-foreground">{signal.source}</p>
        ) : null}
      </div>

      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{signal.body}</p>

      <div className="space-y-2 border-t border-border/20 pt-4">
        {host ? (
          <div className="flex items-center justify-center gap-2 flex-wrap">
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
                role="status"
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
              'inline-flex items-center gap-1.5 text-xs font-medium text-nox-text-link/90 hover:text-nox-text-link transition-colors',
            )}
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            {signal.source || t('companions.fullview.signal.readSource')}
          </a>
        </div>
      </div>
    </div>
  );
}
