import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface Props {
  threshold: number;
  onSet: (val: number) => void;
  cumulativeThreshold: number;
  onSetCumulative: (val: number) => void;
}

export function ThresholdSetting({ threshold, onSet, cumulativeThreshold, onSetCumulative }: Props) {
  const [value, setValue] = useState(threshold);
  const [cumValue, setCumValue] = useState(cumulativeThreshold);

  return (
    <div className="space-y-8">
      {/* Daily threshold */}
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-mono">Daily volatility threshold</p>
          <p className="text-3xl font-mono tracking-tight">{value.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">in 24 hours</p>
        </div>

        <Slider
          value={[value]}
          onValueChange={([v]) => setValue(v)}
          min={1}
          max={20}
          step={0.5}
          className="w-full"
        />

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setValue(5); onSet(5); }}
            className="font-mono text-xs"
          >
            Reset to default
          </Button>
          {value !== threshold && (
            <Button size="sm" onClick={() => onSet(value)} className="font-mono text-xs">
              Confirm
            </Button>
          )}
        </div>
      </div>

      {/* Cumulative threshold */}
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-mono">7-day cumulative threshold</p>
          <p className="text-3xl font-mono tracking-tight">{cumValue.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">rolling 7-day window</p>
        </div>

        <Slider
          value={[cumValue]}
          onValueChange={([v]) => setCumValue(v)}
          min={3}
          max={40}
          step={1}
          className="w-full"
        />

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setCumValue(15); onSetCumulative(15); }}
            className="font-mono text-xs"
          >
            Reset to default
          </Button>
          {cumValue !== cumulativeThreshold && (
            <Button size="sm" onClick={() => onSetCumulative(cumValue)} className="font-mono text-xs">
              Confirm
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
