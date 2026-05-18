import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { PRICING } from '@/lib/pricing';
import type { Entitlement } from '@/lib/subscription-entitlement';

type Props = {
  entitlement: Entitlement;
  checkoutLoading: boolean;
  trialLoading: boolean;
  onReactivate: () => void;
  onStartTrial: () => void;
  onReturn?: () => void;
};

/** Shown when ritual engagement is blocked (`lapsed` or `pre_trial`). */
export function PauseEngagementBlocked({
  entitlement,
  checkoutLoading,
  trialLoading,
  onReactivate,
  onStartTrial,
  onReturn,
}: Props) {
  const { t } = useTranslation();
  const lapsed = entitlement === 'lapsed';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <motion.div
        className="w-full max-w-sm space-y-6 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
          {lapsed
            ? t('pause.lapsed.kicker', { defaultValue: 'Trial ended' })
            : t('pause.preTrial.kicker', { defaultValue: 'Start your trial' })}
        </p>
        <h1 className="text-lg font-medium text-foreground leading-snug">
          {lapsed
            ? t('pause.lapsed.title', { defaultValue: 'Add a card to keep pausing' })
            : t('pause.preTrial.title', {
                days: PRICING.trialDays,
                defaultValue: 'Start your {{days}}-day free trial',
              })}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lapsed
            ? t('pause.lapsed.body', {
                defaultValue:
                  'Your archive and journey are still here. Subscribe to open and complete pauses when markets move.',
              })
            : t('pause.preTrial.body', {
                days: PRICING.trialDays,
                defaultValue:
                  'No card required. Full pause ritual for {{days}} days — cancel anytime before it ends.',
              })}
        </p>
        <LoadingButton
          onClick={lapsed ? onReactivate : onStartTrial}
          loading={lapsed ? checkoutLoading : trialLoading}
          loadingText={
            lapsed
              ? t('home.subscription.openingCheckout', { defaultValue: 'Opening checkout…' })
              : t('onboarding.ready.startingTrial', { defaultValue: 'Starting trial…' })
          }
          className="w-full font-mono text-xs h-10 gap-2"
        >
          <Sparkles className="h-3 w-3" />
          {lapsed
            ? t('pause.lapsed.cta', { defaultValue: 'Subscribe to continue' })
            : t('pause.preTrial.cta', {
                days: PRICING.trialDays,
                defaultValue: 'Start {{days}}-day free trial',
              })}
        </LoadingButton>
        {onReturn ? (
          <button
            type="button"
            onClick={onReturn}
            className="text-[10px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            {t('common.back')}
          </button>
        ) : null}
      </motion.div>
    </div>
  );
}
