import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Clock, Globe, CloudOff, PenLine, ChevronDown, ChevronUp } from 'lucide-react';
import { CompanionError } from './CompanionError';
import { format } from 'date-fns';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { formatBtcPrice } from '@/features/market/public';
import { useSubscription } from '@/hooks/use-subscription';
import { toast } from 'sonner';
import { TOOLS } from '@/lib/app-routes';

import type { ZoomOutData } from '@/features/pause/public';

export type { EchoUserWord, ZoomOutData, ZoomOutEchoData } from '@/features/pause/public';

interface Props {
  data: ZoomOutData | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
}

const outcomeLabels: Record<string, string> = {
  held: 'Held', hold: 'Held', sold: 'Sold', bought: 'Bought', nothing: 'Held',
};

export function ZoomOutDisplay({ data, loading, error, onRetry }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscribed, startCheckout } = useSubscription();
  const { currency } = useHolzen();
  const [quoteExpanded, setQuoteExpanded] = useState(false);
  const fmtPrice = (n: number) => formatBtcPrice(n, currency);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    );
  }

  if (error) {
    return <CompanionError companionType="zoomOut" onRetry={onRetry} />;
  }
  if (!data) return null;

  const { onThisDay, currentPrice, echo, deepTime } = data;

  // Show deep time or echo even without price data — the companion is still valuable.
  const hasPrices = currentPrice && onThisDay.length > 0;
  const hasEcho = !!echo && (echo.userWords?.length ?? 0) > 0;
  const hasContent = !!deepTime || hasEcho;
  const isEmpty = !hasPrices && !hasContent;

  const goToReplay = () => {
    if (!echo?.id) return;
    if (!subscribed) {
      const descKey = 'pro.desc_replay';
      const description = t(descKey) !== descKey ? t(descKey) : t('pro.upgradeDesc');
      toast(t('pro.featureLocked'), {
        description,
        action: { label: t('pro.upgradeCta'), onClick: () => startCheckout() },
        duration: 6000,
      });
      return;
    }
    navigate(TOOLS.practice.replay, {
      state: { pauseInstanceId: echo.id, returnTo: location.pathname + location.search },
    });
  };

  return (
    <div className="space-y-4">
      {isEmpty && (
        <div className="rounded-lg border border-border/30 bg-muted/20 px-4 py-3.5 space-y-1.5">
          <p className="text-xs font-mono text-muted-foreground/70 leading-relaxed">
            Perspective takes time to build.
          </p>
          <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
            The more you pause and add notes, the richer your zoom-out view becomes. Historical price data and your own words from past pauses will appear here over time.
          </p>
        </div>
      )}
      {/* On this day - price timeline */}
      {currentPrice && onThisDay.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
              BTC on this day
            </p>
            {data.partial && (
              <span className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground/35">
                <CloudOff className="h-2.5 w-2.5" />
                partial
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {[...onThisDay].reverse().map((entry) => {
              const changePct = ((currentPrice - entry.price) / entry.price) * 100;
              const isUp = changePct >= 0;
              return (
                <div key={entry.yearsAgo} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground/60 w-16 shrink-0">
                    {entry.yearsAgo}y ago
                  </span>
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    {fmtPrice(entry.price)}
                  </span>
                  <span className={`text-[10px] font-mono tabular-nums flex items-center gap-0.5 ${isUp ? 'text-foreground/75' : 'text-destructive/70'}`}>
                    {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {isUp ? '+' : ''}{changePct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
              <span className="text-[10px] font-mono text-muted-foreground/60 w-16 shrink-0">
                Now
              </span>
              <span className="text-xs font-mono text-foreground font-medium tabular-nums">
                {fmtPrice(currentPrice)}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground/40">—</span>
            </div>
          </div>
        </div>
      )}

      {/* Deep Time — civilizational / planetary perspective */}
      {deepTime && (
        <div className="rounded-lg border border-primary/10 bg-primary/[0.03] px-4 py-3.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <Globe className="h-3 w-3 text-muted-foreground/50" />
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
              Deep time
            </p>
          </div>
          <p className="text-[10px] font-mono text-foreground/70 uppercase tracking-wide leading-snug">
            {deepTime.title}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {deepTime.body}
          </p>
        </div>
      )}

      {/* Echo - user-authored past words only (note + replay). Never AI text. */}
      {(() => {
        const userWords = echo?.userWords ?? [];
        const primary = userWords[0];
        const extraCount = Math.max(0, userWords.length - 1);
        if (!echo || !primary) {
          // Strict empty state: no user notes/replays exist for recent pauses.
          return (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground/50" />
                <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                  {t('companions.echoEmptyTitle')}
                </p>
              </div>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                {t('companions.echoEmptyBody')}
              </p>
            </div>
          );
        }
        const quoteLong = primary.body.length > 220;
        return (
          <div className="rounded-lg border border-border/40 bg-muted/[0.08] px-3.5 py-3 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground/50" />
                <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                  {t('companions.echoHeader', {
                    date: format(new Date(primary.created_at), 'MMM d, yyyy'),
                    kind:
                      primary.kind === 'replay'
                        ? t('companions.echoKindReplay')
                        : t('companions.echoKindNote'),
                  })}
                </p>
              </div>
              <p
                className={`text-xs text-muted-foreground leading-relaxed italic ${
                  quoteExpanded ? '' : 'line-clamp-4'
                }`}
              >
                &ldquo;{primary.body}&rdquo;
              </p>
              {quoteLong && (
                <button
                  type="button"
                  onClick={() => setQuoteExpanded((v) => !v)}
                  className="text-[9px] font-mono text-muted-foreground/50 hover:text-muted-foreground/70 flex items-center gap-1"
                >
                  {quoteExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {quoteExpanded
                    ? t('common.showLess', { defaultValue: 'Show less' })
                    : t('companions.echoExpandQuote')}
                </button>
              )}
              <div className="flex gap-1.5 flex-wrap">
                {echo.mood && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                    {echo.mood}
                  </span>
                )}
                {echo.outcome && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                    {outcomeLabels[echo.outcome] || echo.outcome}
                  </span>
                )}
              </div>
              {extraCount > 0 && (
                <p className="text-[10px] font-mono text-muted-foreground/55">
                  {t('companions.echoMoreEntries', { count: extraCount })}
                </p>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
              {t('companions.echoFraming')}
            </p>
            <div className="space-y-1">
              <p className="text-[9px] font-mono text-muted-foreground/45 uppercase tracking-wider">
                {t('companions.echoPromptIntro')}
              </p>
              <ul className="text-[10px] text-muted-foreground/65 leading-relaxed list-disc pl-4 space-y-0.5">
                <li>{t('companions.echoPrompt1')}</li>
                <li>{t('companions.echoPrompt2')}</li>
                <li>{t('companions.echoPrompt3')}</li>
              </ul>
            </div>

            {echo.id ? (
              <button
                type="button"
                onClick={goToReplay}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-primary/25 bg-primary/[0.06] hover:bg-primary/[0.1] transition-colors"
              >
                <PenLine className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] font-mono text-muted-foreground tracking-[0.12em] uppercase">
                  {extraCount > 0
                    ? t('companions.echoContinueThreadCta')
                    : t('companions.echoRespondCta')}
                </span>
              </button>
            ) : null}
          </div>
        );
      })()}
    </div>
  );
}
