import { useState, useEffect, forwardRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  thresholdUp: number;
  onSetUp: (val: number) => void;
  thresholdDown: number;
  onSetDown: (val: number) => void;
  cumulativeThreshold: number;
  onSetCumulative: (val: number) => void;
}

export const ThresholdSetting = forwardRef<HTMLDivElement, Props>(function ThresholdSetting(
  { thresholdUp, onSetUp, thresholdDown, onSetDown, cumulativeThreshold, onSetCumulative },
  ref
) {
  const [upVal, setUpVal] = useState(thresholdUp);
  const [downVal, setDownVal] = useState(thresholdDown);
  const [cumVal, setCumVal] = useState(cumulativeThreshold);

  useEffect(() => { setUpVal(thresholdUp); }, [thresholdUp]);
  useEffect(() => { setDownVal(thresholdDown); }, [thresholdDown]);
  useEffect(() => { setCumVal(cumulativeThreshold); }, [cumulativeThreshold]);

  return (
    <div ref={ref} className="space-y-8">
      {/* Daily threshold — UP */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
            <p className="text-sm text-muted-foreground font-mono">Price rises threshold</p>
          </div>
          <p className="text-3xl font-mono tracking-tight">{upVal.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">trigger when BTC rises this much in 24h</p>
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
            Reset
          </Button>
          {upVal !== thresholdUp && (
            <Button size="sm" onClick={() => onSetUp(upVal)} className="font-mono text-xs">
              Confirm
            </Button>
          )}
        </div>
      </div>

      {/* Daily threshold — DOWN */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ArrowDown className="h-3.5 w-3.5 text-destructive" />
            <p className="text-sm text-muted-foreground font-mono">Price drops threshold</p>
          </div>
          <p className="text-3xl font-mono tracking-tight">{downVal.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">trigger when BTC drops this much in 24h</p>
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
            Reset
          </Button>
          {downVal !== thresholdDown && (
            <Button size="sm" onClick={() => onSetDown(downVal)} className="font-mono text-xs">
              Confirm
            </Button>
          )}
        </div>
      </div>

      {/* Cumulative threshold */}
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-mono">7-day cumulative threshold</p>
          <p className="text-3xl font-mono tracking-tight">{cumVal.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">rolling 7-day window</p>
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
            Reset
          </Button>
          {cumVal !== cumulativeThreshold && (
            <Button size="sm" onClick={() => onSetCumulative(cumVal)} className="font-mono text-xs">
              Confirm
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
