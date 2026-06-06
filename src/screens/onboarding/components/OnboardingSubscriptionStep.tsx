import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  formatMotivationLine,
} from '@/features/user/domain/profile-motivations';
import { trackedAssetSymbol } from '@/features/market/public';
import { PRICING } from '@/features/subscription/public';

interface Props {
  trackedAssetId: string;
  threshold: number;
  motivations: string[];
  onStartTrial: () => void;
  trialLoading: boolean;
  stagger: (delay: number) => object;
}

export function OnboardingSubscriptionStep({
  trackedAssetId,
  threshold,
  motivations,
  onStartTrial,
  trialLoading,
  stagger,
}: Props) {
  "use memo";
  const { t } = useTranslation();
  const assetSymbol = trackedAssetSymbol(trackedAssetId);

  const motivationLine = useMemo(
    () =>
      formatMotivationLine(motivations, (id) =>
        t(`settings.motivations.${id}`, id),
      ),
    [motivations, t],
  );

  return (
    <div className="space-y-6">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
          {t('onboarding.ready.title', { defaultValue: "You're set" })}
        </p>
        <motion.div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      <motion.div className="space-y-1" {...stagger(0.15)}>
        <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground/50">
          {t('onboarding.ready.recapWhy', { defaultValue: 'Your why' })}
        </span>
        <p className="text-sm leading-snug text-foreground/90">
          {motivationLine || t('onboarding.ready.recapWhyUnset', { defaultValue: 'Not set yet' })}
        </p>
      </motion.div>

      <motion.div className="space-y-1" {...stagger(0.18)}>
        <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground/50">
          {t('onboarding.ready.recapAsset', { defaultValue: 'Tracked asset' })}
        </span>
        <p className="text-sm leading-snug text-foreground/90">{assetSymbol}</p>
      </motion.div>

      <motion.div className="space-y-1" {...stagger(0.2)}>
        <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground/50">
          {t('onboarding.ready.recapThreshold', { defaultValue: 'Pause trigger' })}
        </span>
        <p className="text-sm leading-snug text-foreground/90">+/- {threshold.toFixed(1)}%</p>
      </motion.div>

      <motion.p className="text-sm leading-relaxed text-muted-foreground" {...stagger(0.25)}>
        {t('onboarding.ready.trialBodyConfigured', {
          days: PRICING.trialDays,
          asset: assetSymbol,
          threshold: threshold.toFixed(1),
          defaultValue:
            'Start your {{days}}-day trial and Holzen will watch {{asset}} for moves of about +/-{{threshold}}%. No card required - cancel anytime before it ends.',
        })}
      </motion.p>

      <motion.div className="space-y-3 pt-1" {...stagger(0.35)}>
        <LoadingButton
          onClick={onStartTrial}
          loading={trialLoading}
          loadingText={t('onboarding.ready.startingTrial', { defaultValue: 'Starting trial...' })}
          className="h-10 w-full gap-2 font-mono text-xs"
        >
          <Sparkles className="h-3 w-3" />
          {t('onboarding.ready.startTrialNoCard', {
            days: PRICING.trialDays,
            defaultValue: 'Start {{days}}-day free trial',
          })}
        </LoadingButton>
        <p className="text-center text-[10px] font-mono text-muted-foreground/40">
          {t('onboarding.ready.trialFinePrintNoCard', {
            price: PRICING.monthlyPrice,
            defaultValue: 'Then ${{price}}/mo if you keep going · Cancel anytime',
          })}
        </p>
      </motion.div>
    </div>
  );
}
