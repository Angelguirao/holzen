import { useState, useEffect, forwardRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThresholdFrequencyEstimator } from '@/components/ThresholdFrequencyEstimator';

interface Props {
  thresholdUp: number;
  onSetUp: (val: number) => void;
  thresholdDown: number;
  onSetDown: (val: number) => void;
  cumulativeThreshold: number;
  onSetCumulative: (val: number) => void;
  cooldownHours?: number;
  /** CoinGecko coin id for volatility frequency estimates. */
  trackedAssetId?: string;
}

export const ThresholdSetting = forwardRef<HTMLDivElement, Props>(function ThresholdSetting(
  { thresholdUp, onSetUp, thresholdDown, onSetDown, cumulativeThreshold, onSetCumulative, cooldownHours, trackedAssetId = 'bitcoin' },
  ref
) {
  const { t } = useTranslation();
  const [upVal, setUpVal] = useState(thresholdUp);
  const [downVal, setDownVal] = useState(thresholdDown);
  const [cumVal, setCumVal] = useState(cumulativeThreshold);

  useEffect(() => { setUpVal(thresholdUp); }, [thresholdUp]);
  useEffect(() => { setDownVal(thresholdDown); }, [thresholdDown]);
  useEffect(() => { setCumVal(cumulativeThreshold); }, [cumulativeThreshold]);

  return (
    <div ref={ref} className="space-y-8">
      <ThresholdFrequencyEstimator
        thresholdUp={upVal}
        thresholdDown={downVal}
        cumulativeThreshold={cumVal}
        cooldownHours={cooldownHours}
        coinId={trackedAssetId}
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowUp className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
            <p className="text-base font-sans text-primary">{t('threshold.priceRises')}</p>
          </div>
          <p className="text-3xl tracking-tight text-primary font-sans font-semibold">{upVal.toFixed(1)}%</p>
          <p className="font-sans text-base text-muted-foreground">{t('threshold.triggerRises')}</p>
        </div>

        <Slider
          value={[upVal]}
          onValueChange={([v]) => setUpVal(v)}
          min={1}
          max={20}
          step={0.5}
          className="w-full"
        />

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setUpVal(5); onSetUp(5); }}
            className="font-mono text-xs"
          >
            {t('common.reset')}
          </Button>
          {upVal !== thresholdUp && (
            <Button size="sm" onClick={() => onSetUp(upVal)} className="font-mono text-xs">
              {t('threshold.confirm')}
            </Button>
          )}
        </div>
      </div>

      {/* Daily threshold — DOWN */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowDown className="h-3.5 w-3.5 text-destructive" />
            <p className="font-sans text-base text-primary">{t('threshold.priceDrops')}</p>
          </div>
          <p className="text-3xl tracking-tight font-sans font-semibold text-primary">{downVal.toFixed(1)}%</p>
          <p className="font-sans text-base text-muted-foreground">{t('threshold.triggerDrops')}</p>
        </div>

        <Slider
          value={[downVal]}
          onValueChange={([v]) => setDownVal(v)}
          min={1}
          max={20}
          step={0.5}
          className="w-full"
        />

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setDownVal(5); onSetDown(5); }}
            className="font-mono text-xs"
          >
            {t('common.reset')}
          </Button>
          {downVal !== thresholdDown && (
            <Button size="sm" onClick={() => onSetDown(downVal)} className="font-mono text-xs">
              {t('threshold.confirm')}
            </Button>
          )}
        </div>
      </div>

      {/* Cumulative threshold */}
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-base font-sans text-secondary-foreground">{t('threshold.cumulative')}</p>
          <p className="text-3xl font-mono tracking-tight">{cumVal.toFixed(1)}%</p>
          <p className="text-base font-sans text-muted-foreground">{t('threshold.rolling7day')}</p>
        </div>

        <Slider
          value={[cumVal]}
          onValueChange={([v]) => setCumVal(v)}
          min={3}
          max={40}
          step={1}
          className="w-full"
        />

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setCumVal(15); onSetCumulative(15); }}
            className="font-mono text-xs"
          >
            {t('common.reset')}
          </Button>
          {cumVal !== cumulativeThreshold && (
            <Button size="sm" onClick={() => onSetCumulative(cumVal)} className="font-mono text-xs">
              {t('threshold.confirm')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
