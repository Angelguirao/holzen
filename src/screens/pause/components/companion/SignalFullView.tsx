import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { getSignalSourcesCatalogQueryOptions } from '@/features/user/public-queries';
import { CompanionError } from '../CompanionError';
import { ReadTime } from './ReadTime';
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
}

/**
 * Full-page Signal presentation.
 *
 * Differs from the inline `SignalDisplay` in three ways:
 * 1. Favicon + publisher domain label sit above the source link rather than
 *    being a tiny mono-font line, so the source itself reads as a credibility
 *    cue rather than a footnote.
 * 2. A small "trusted source" badge renders when the signal's URL host matches
 *    a row in the curated `signal_sources` table. Falls back silently when the
 *    table or URL is unavailable.
 * 3. Adds `ReadTime` and (optional) `WhyThisCard` since Full View is a reading
 *    screen, not an interaction-dense card.
 */
export function SignalFullView({
  signal,
  loading,
  error,
  onRetry,
  mood,
  marketDirection,
  preferredBias,
}: Props) {
  const { t } = useTranslation();

  const host = extractHost(signal?.url);

  const { data: catalog = [], isPending, isError } = useQuery(
    getSignalSourcesCatalogQueryOptions(Boolean(host)),
  );

  const isTrusted = useMemo((): boolean | null => {
    if (!host) return null;
    if (isPending) return null;
    if (isError) return false;
    if (catalog.length === 0) return false;
    const trustedHosts = new Set<string>();
    for (const row of catalog) {
      const h = extractHost(row.url);
      if (h) trustedHosts.add(h);
    }
    return trustedHosts.has(host);
  }, [host, catalog, isPending, isError]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
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

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <ReadTime chars={bodyChars} />
        <WhyThisCard
          companion="signal"
          mood={mood}
          marketDirection={marketDirection}
          preferredBias={preferredBias}
          className="ml-auto"
        />
      </div>

      <h2 className="text-base font-medium leading-snug text-foreground">{signal.title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{signal.body}</p>

      <div className="pt-2 space-y-2 border-t border-border/20">
        {host && (
          <div className="flex items-center gap-2">
            {/* `s2/favicons` is Google's public favicon service — no API key, caches aggressively, degrades to a default glyph on misses. */}
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
            {isTrusted === true && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-1.5 py-[2px] text-[9px] font-mono text-muted-foreground"
                role="status"
              >
                <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                {t('companions.fullview.signal.trusted')}
              </span>
            )}
          </div>
        )}
        <a
          href={signal.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-nox-text-link/90 hover:text-nox-text-link transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          {signal.source || t('companions.fullview.signal.readSource')}
        </a>
      </div>
    </div>
  );
}

/**
 * Extract a normalized host (lowercase, no `www.`) from a URL-looking string.
 * Returns `null` for invalid input; callers render no host-dependent UI in
 * that case.
 */
function extractHost(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}
