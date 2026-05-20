import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useHolzen } from '@/app/components/HolzenProvider';
import { formatBtcPrice } from '@/features/market/public';
import { useSubscription } from '@/features/subscription/public-hooks';
import type { ZoomOutData } from '@/features/pause/public';
import { companionHistoryPath } from '@/lib/app-routes';
import { CompanionError } from '@/screens/pause/components/CompanionError';
import { ZoomOutDeepTime } from '@/screens/pause/components/zoom-out-deep-time';
import { ZoomOutEchoPanel } from '@/screens/pause/components/zoom-out-echo-panel';
import { ZoomOutOnThisDay } from '@/screens/pause/components/zoom-out-on-this-day';

export type { EchoUserWord, ZoomOutData, ZoomOutEchoData } from '@/features/pause/public';

interface Props {
  data: ZoomOutData | null;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
}

export function ZoomOutDisplay({ data, loading, error, onRetry }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { subscribed, startCheckout } = useSubscription();
  const { currency } = useHolzen();
  const fmtPrice = (n: number) => formatBtcPrice(n, currency);

  const goToReplay = useCallback(() => {
    const echoId = data?.echo?.id;
    if (!echoId) return;
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
    navigate(companionHistoryPath(echoId), {
      state: { returnTo: location.pathname + location.search },
    });
  }, [data?.echo?.id, subscribed, t, startCheckout, navigate, location.pathname, location.search]);

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
  const hasPrices = currentPrice && onThisDay.length > 0;
  const hasEcho = !!echo && (echo.userWords?.length ?? 0) > 0;
  const hasContent = !!deepTime || hasEcho;
  const isEmpty = !hasPrices && !hasContent;

  return (
    <div className="space-y-4">
      {isEmpty ? (
        <div className="rounded-lg border border-border/30 bg-muted/20 px-4 py-3.5 space-y-1.5">
          <p className="text-xs font-mono text-muted-foreground/70 leading-relaxed">
            Perspective takes time to build.
          </p>
          <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
            The more you pause and add notes, the richer your zoom-out view becomes. Historical price data and your
            own words from past pauses will appear here over time.
          </p>
        </div>
      ) : null}

      {hasPrices && currentPrice ? (
        <ZoomOutOnThisDay
          currentPrice={currentPrice}
          onThisDay={onThisDay}
          partial={data.partial}
          formatPrice={fmtPrice}
        />
      ) : null}

      {deepTime ? <ZoomOutDeepTime deepTime={deepTime} /> : null}

      <ZoomOutEchoPanel echo={echo} onGoToReplay={goToReplay} />
    </div>
  );
}
