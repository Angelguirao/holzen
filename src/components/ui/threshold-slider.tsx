import * as React from "react";
import { Slider } from "@/components/ui/slider";

interface ThresholdSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function ThresholdSlider({ value, onValueChange, min = 0, max = 100 }: ThresholdSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Threshold</span>
        <span>{value}%</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={([next]) => onValueChange(next)} />
    </div>
  );
}

