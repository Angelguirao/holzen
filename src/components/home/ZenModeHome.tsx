import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { ReflectionMessage } from '@/components/ReflectionMessage';
import { HomePauseEmptyFlow } from '@/components/home/HomePauseEmptyFlow';
import { HomePauseBlockingErrorPanel } from '@/components/home/HomePauseBlockingErrorPanel';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionSkeleton } from '@/components/SubscriptionSkeleton';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { BtcPriceData } from '@/lib/btc';
import type { BtcMoveSeverity } from '@/lib/btc-move-severity';
import { shouldSurfacePauseWidgetError } from '@/lib/home-pause-widget-error';

export interface ZenModeHomeProps {
  message: string | null;
  context: string | null;
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
  subscriptionReady: boolean;
  hasAccess: boolean;
  showLimitUpsell: boolean;
  showPauseScheduling: boolean;
  pinnedPreview: ReactNode;
  autoCooldownRemaining: () => number;
  cooldownHours: number;
  nextCronCheckIn: () => number;
  manualCooldownRemaining: () => number;
  checkoutLoading: boolean;
  onStartCheckoutPro: () => void;
}

/** Minimal Home layout when Zen mode is enabled in customize / settings. */
export function ZenModeHome({
  message,
  context,
  companions,
  companionPrefs,
  severity,
  lastPauseInstanceId,
  loading,
  error,
  btcData,
  onDismiss,
  onNeedPause,
  onManualTrigger,
  subscriptionReady,
  hasAccess,
  showLimitUpsell,
  showPauseScheduling,
  pinnedPreview,
  autoCooldownRemaining,
  cooldownHours,
  nextCronCheckIn,
  manualCooldownRemaining,
  checkoutLoading,
  onStartCheckoutPro,
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

  return (
    <div className="min-h-[60vh] flex flex-col justify-center text-sm font-sans">
      <AnimatePresence mode="wait">
        {message ? (
          <motion.div key="zen-reflection" variants={zenVariants} initial="hidden" animate="visible" exit="hidden">
            <ReflectionMessage
              message={message}
              context={context}
              onDismiss={onDismiss}
              companions={companions}
              companionPrefs={{
                breathing: companionPrefs.breathing,
                haiku: false,
                grounding: false,
                signal: false,
                zoomOut: false,
                history: false,
              }}
              severity={severity}
              pauseInstanceId={lastPauseInstanceId}
            />
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
              <p className="text-xs font-mono">{t('home.generatingReflection')}</p>
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
                pinnedPreview={pinnedPreview}
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
                <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                  {t('home.subscription.monthlyLimitReached', {
                    defaultValue: "You've used your free pauses this month.",
                  })}
                </p>
                <p className="text-xs text-muted-foreground/60 font-mono leading-relaxed max-w-[280px] mx-auto">
                  {t('home.subscription.upgradeToPro')}
                </p>
                <LoadingButton
                  onClick={onStartCheckoutPro}
                  loading={checkoutLoading}
                  loadingText={t('home.subscription.openingCheckout')}
                  size="sm"
                  className="font-mono text-xs"
                >
                  {t('pro.upgradeCta')}
                </LoadingButton>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
