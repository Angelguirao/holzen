import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MotivationPickerGrid } from '@/features/user/presentation/MotivationPickerGrid';

interface Props {
  motivations: string[];
  onChange: (next: string[]) => void;
  showMinimumError: boolean;
  stagger: (delay: number) => object;
}

export function OnboardingWhyStep({ motivations, onChange, showMinimumError, stagger }: Props) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
          {t('onboarding.why.kicker', { defaultValue: 'Your why' })}
        </p>
        <div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      <motion.div className="space-y-2" {...stagger(0.15)}>
        <h2 className="text-xl font-medium tracking-tight text-foreground">
          {t('onboarding.yourWhy', { defaultValue: 'Why do you invest?' })}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('onboarding.whyIntro', {
            defaultValue:
              'Why you are here as an investor. Pick what resonates — this anchors your Home widget and shapes pause copy.',
          })}
        </p>
      </motion.div>

      <motion.div {...stagger(0.25)}>
        <MotivationPickerGrid
          selected={motivations}
          onChange={onChange}
          showMinimumError={showMinimumError}
        />
      </motion.div>

      <motion.p className="text-[10px] text-muted-foreground/50" {...stagger(0.4)}>
        {t('onboarding.whyHint', { defaultValue: 'You can change this anytime from Home or Settings.' })}
      </motion.p>
    </div>
  );
}
