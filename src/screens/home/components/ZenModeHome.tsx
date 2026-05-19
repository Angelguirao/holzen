import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { HomePauseEmptyFlow } from '@/screens/home/components/HomePauseEmptyFlow';
import { HomePauseContextMeta } from '@/screens/home/components/HomePauseContextMeta';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { HomePauseBlockingErrorPanel } from '@/screens/home/components/HomePauseBlockingErrorPanel';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionSkeleton } from '@/screens/home/components/SubscriptionSkeleton';
import type { CompanionData, CompanionPrefs } from '@/screens/pause/components/CompanionSection';
import type { BtcPriceData } from '@/features/market/public';
import type { BtcMoveSeverity } from '@/features/market/public';
import { shouldSurfacePauseWidgetError } from '@/screens/home/lib/home-pause-widget-error';
import type { Entitlement } from '@/features/subscription/public';

export interface ZenModeHomeProps {
  hasOpenPause: boolean;
  context: string | null;
  contextPreview: { btc24h: string | null; marketSentiment: string | null };
  openPauseState: 'active' | 'engaged' | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: BtcMoveSeverity;
  lastPauseInstanceId: string | null;
  loading: boolean;
  error: string | null;
  btcData: BtcPriceData | null;
  onDismiss: () => void;
  /** Cooldown-aware entry from empty flow (“Need a moment”). */
  onNeedPause: () => void;
  /** Direct regenerate (error panel Try again). */
  onManualTrigger: () => void;
  onPauseWithThis: () => void;
  subscriptionReady: boolean;
  hasAccess: boolean;
  showLimitUpsell: boolean;
  entitlement: Entitlement;
  showPauseScheduling: boolean;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  checkoutLoading: boolean;
  trialLoading: boolean;
  onStartTrial: () => void;
  onReactivate: () => void;
}

/** Minimal Home layout when Zen mode is enabled in customize / settings. */
export function ZenModeHome({
  hasOpenPause,
  context,
  contextPreview,
  openPauseState,
  loading,
  error,
  btcData,
  onDismiss,
  onNeedPause,
  onManualTrigger,
  onPauseWithThis,
  subscriptionReady,
  hasAccess,
  showLimitUpsell,
  entitlement,
  showPauseScheduling,
  autoCooldownRemaining,
  cooldownHours,
  nextCronCheckIn,
  manualCooldownRemaining,
  checkoutLoading,
  trialLoading,
  onStartTrial,
  onReactivate,
}: ZenModeHomeProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const zenTransition = { duration: 0.8, ease: 'easeOut' as const };
  const zenVariants = prefersReducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: zenTransition },
      };

  const blockingError = error && shouldSurfacePauseWidgetError(error, btcData) ? error : null;
  const pausePrimaryCta =
    openPauseState === 'engaged'
      ? t('home.pauseCtaEngaged')
      : t('home.pauseCtaActive');

  return (
    <div className="min-h-[60vh] flex flex-col justify-center text-sm font-sans">
      <AnimatePresence mode="wait">
        {hasOpenPause ? (
          <motion.div
            key="zen-open-pause"
            variants={zenVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mx-auto max-w-md space-y-4 text-left"
          >
            <HomePauseContextMeta
              btc24h={contextPreview.btc24h}
              marketSentiment={contextPreview.marketSentiment}
              className="min-w-0"
            />
            {context?.trim() ? (
              <p className="text-xs font-mono leading-relaxed text-muted-foreground">{context.trim()}</p>
            ) : null}
            <button
              type="button"
              onClick={onPauseWithThis}
              className={cn(homeInWidget.ctaPrimary, 'w-full bg-foreground text-background hover:bg-foreground/90')}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-background" aria-hidden />
              {pausePrimaryCta}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="w-full rounded-lg border border-border/80 bg-transparent px-3 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
            >
              {t('home.pauseDismissCta', { defaultValue: 'Dismiss pause' })}
            </button>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="zen-loading"
            variants={zenVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              <p className="text-xs font-mono">{t('home.openingPause', { defaultValue: 'Opening your pause…' })}</p>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </motion.div>
        ) : blockingError ? (
          <motion.div
            key="zen-blocking-error"
            variants={zenVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="max-w-md mx-auto text-left"
          >
            <HomePauseBlockingErrorPanel error={blockingError} onTryAgain={onManualTrigger} />
          </motion.div>
        ) : !subscriptionReady ? (
          <motion.div key="zen-hydrating" variants={zenVariants} initial="hidden" animate="visible" exit="hidden">
            <SubscriptionSkeleton variant="centered" />
          </motion.div>
        ) : (
          <motion.div
            key="zen-empty"
            variants={zenVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="text-center"
          >
            {hasAccess && !showLimitUpsell ? (
              <HomePauseEmptyFlow
                variant="zen"
                showPauseScheduling={showPauseScheduling}
                autoCooldownRemaining={autoCooldownRemaining}
                cooldownHours={cooldownHours}
                nextCronCheckIn={nextCronCheckIn}
                onNeedPause={onNeedPause}
                manualCooldownRemaining={manualCooldownRemaining}
                pauseLoading={loading}
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground font-mono leading-relaxed max-w-[280px] mx-auto">
                  {entitlement === 'lapsed'
                    ? t('home.subscription.trialEnded')
                    : t('home.subscription.startTrialPrompt')}
                </p>
                <LoadingButton
                  onClick={entitlement === 'lapsed' ? onReactivate : onStartTrial}
                  loading={entitlement === 'lapsed' ? checkoutLoading : trialLoading}
                  loadingText={
                    entitlement === 'lapsed'
                      ? t('home.subscription.openingCheckout')
                      : t('onboarding.ready.startingTrial', { defaultValue: 'Starting trial…' })
                  }
                  size="sm"
                  className="font-mono text-xs"
                >
                  {entitlement === 'lapsed'
                    ? t('pro.upgradeCta')
                    : t('home.subscription.startTrialCta')}
                </LoadingButton>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
