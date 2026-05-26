import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { trackedAssetSymbol } from '@/features/market/public';
import { ThresholdSetting } from '@/screens/settings/components/ThresholdSetting';

interface Props {
  trackedAssetId: string;
  thresholdUp: number;
  onThresholdUpChange: (value: number) => void;
  thresholdDown: number;
  onThresholdDownChange: (value: number) => void;
  cumulativeThreshold: number;
  onCumulativeThresholdChange: (value: number) => void;
  stagger: (delay: number) => object;
}

export function OnboardingThresholdStep({
  trackedAssetId,
  thresholdUp,
  onThresholdUpChange,
  thresholdDown,
  onThresholdDownChange,
  cumulativeThreshold,
  onCumulativeThresholdChange,
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
              'Set the same thresholds Holzen uses in Settings so your first run matches the ongoing product behavior for {{asset}}.',
          })}
        </p>
      </motion.div>

      <motion.div {...stagger(0.25)}>
        <ThresholdSetting
          thresholdUp={thresholdUp}
          onSetUp={onThresholdUpChange}
          thresholdDown={thresholdDown}
          onSetDown={onThresholdDownChange}
          cumulativeThreshold={cumulativeThreshold}
          onSetCumulative={onCumulativeThresholdChange}
          trackedAssetId={trackedAssetId}
          commitMode="live"
        />
      </motion.div>
    </div>
  );
}
