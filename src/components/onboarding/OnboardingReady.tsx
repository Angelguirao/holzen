import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { PRICING } from '@/lib/pricing';

interface Props {
  motivations: string[];
  onStartTrial: () => void;
  trialLoading: boolean;
  stagger: (delay: number) => object;
}

export function OnboardingReady({ motivations, onStartTrial, trialLoading, stagger }: Props) {
  const { t } = useTranslation();

  const whyRecap =
    motivations.length > 0
      ? motivations.map((m) => t(`settings.motivations.${m}`, { defaultValue: m })).join(', ')
      : null;

  return (
    <div className="space-y-6">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
          {t('onboarding.ready.title', { defaultValue: "You're set" })}
        </p>
        <motion.div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      {whyRecap ? (
        <motion.div className="space-y-1" {...stagger(0.15)}>
          <span className="text-[10px] font-mono tracking-wide uppercase text-muted-foreground/50">
            {t('onboarding.ready.recapWhy', { defaultValue: 'Your why' })}
          </span>
          <p className="text-sm text-foreground/90 leading-snug">{whyRecap}</p>
        </motion.div>
      ) : null}

      <motion.p className="text-sm text-muted-foreground leading-relaxed" {...stagger(0.2)}>
        {t('onboarding.ready.trialBody', {
          days: PRICING.trialDays,
          defaultValue:
            'Start your {{days}}-day trial to use Pause when volatility spikes. No card required — cancel anytime before it ends.',
        })}
      </motion.p>

      <motion.div className="space-y-3 pt-1" {...stagger(0.35)}>
        <LoadingButton
          onClick={onStartTrial}
          loading={trialLoading}
          loadingText={t('onboarding.ready.startingTrial', { defaultValue: 'Starting trial…' })}
          className="w-full font-mono text-xs h-10 gap-2"
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
