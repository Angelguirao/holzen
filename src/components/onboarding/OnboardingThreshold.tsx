import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { ThresholdFrequencyEstimator } from '@/components/ThresholdFrequencyEstimator';

interface Props {
  threshold: number;
  onThresholdChange: (v: number) => void;
  stagger: (delay: number) => object;
}

export function OnboardingThreshold({ threshold, onThresholdChange, stagger }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
          {t('onboarding.yourThreshold', { defaultValue: 'Your threshold' })}
        </p>
        <div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      <motion.p
        className="text-sm text-muted-foreground leading-relaxed"
        {...stagger(0.15)}
      >
        {t('onboarding.thresholdQuestion', {
          defaultValue:
            'How much does Bitcoin need to move (up or down) before you want to pause and reflect?',
        })}
      </motion.p>

      <motion.div {...stagger(0.25)}>
        <p className="text-4xl font-mono tracking-tight mb-6">± {threshold.toFixed(1)}%</p>
        <Slider
          value={[threshold]}
          onValueChange={([v]) => onThresholdChange(v)}
          min={1}
          max={20}
          step={0.5}
          className="w-full"
        />
        <ThresholdFrequencyEstimator thresholdUp={threshold} className="mt-4" />
        <p className="text-[10px] text-muted-foreground/40 mt-3">
          {t('onboarding.changeThresholdLater', {
            defaultValue: 'You can set separate up & down thresholds later in Settings',
          })}
        </p>
      </motion.div>
    </div>
  );
}
