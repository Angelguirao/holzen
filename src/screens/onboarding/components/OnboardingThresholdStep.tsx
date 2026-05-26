import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { trackedAssetSymbol } from '@/features/market/public';
import { ThresholdFrequencyEstimator } from '@/screens/home/components/ThresholdFrequencyEstimator';

interface Props {
  trackedAssetId: string;
  threshold: number;
  onThresholdChange: (value: number) => void;
  stagger: (delay: number) => object;
}

export function OnboardingThresholdStep({
  trackedAssetId,
  threshold,
  onThresholdChange,
  stagger,
}: Props) {
  "use memo";
  const { t } = useTranslation();
  const assetSymbol = trackedAssetSymbol(trackedAssetId);

  return (
    <div className="space-y-8">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
          {t('onboarding.threshold.kicker', { defaultValue: 'Your trigger' })}
        </p>
        <div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      <motion.div className="space-y-2" {...stagger(0.15)}>
        <h2 className="text-xl font-medium tracking-tight text-foreground">
          {t('onboarding.threshold.title', { defaultValue: 'Choose when Holzen should interrupt the impulse' })}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('onboarding.threshold.body', {
            asset: assetSymbol,
            defaultValue:
              'Set the daily move that should trigger a pause. During onboarding, Holzen uses the same threshold for both rises and drops in {{asset}}.',
          })}
        </p>
      </motion.div>

      <motion.div {...stagger(0.25)}>
        <p className="mb-6 text-4xl font-mono tracking-tight text-foreground">
          +/- {threshold.toFixed(1)}%
        </p>
        <Slider
          value={[threshold]}
          onValueChange={([value]) => onThresholdChange(value)}
          min={1}
          max={20}
          step={0.5}
          className="w-full"
        />
        <ThresholdFrequencyEstimator
          thresholdUp={threshold}
          thresholdDown={threshold}
          className="mt-4"
          coinId={trackedAssetId}
        />
        <p className="mt-3 text-[10px] text-muted-foreground/40">
          {t('onboarding.threshold.footer', {
            defaultValue: 'You can split upward and downward thresholds later in Settings.',
          })}
        </p>
      </motion.div>
    </div>
  );
}
