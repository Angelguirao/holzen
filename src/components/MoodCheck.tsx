import { Button } from '@/components/ui/button';
import { Frown, Meh, Smile } from 'lucide-react';

const moods = [
  { value: 'anxious', label: 'Anxious', icon: Frown },
  { value: 'neutral', label: 'Neutral', icon: Meh },
  { value: 'calm', label: 'Calm', icon: Smile },
] as const;

export type MoodValue = (typeof moods)[number]['value'];

interface Props {
  onSelect: (mood: MoodValue) => void;
  onSkip: () => void;
}

export function MoodCheck({ onSelect, onSkip }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-mono text-muted-foreground">How are you feeling right now?</p>
      <div className="grid grid-cols-3 gap-2">
        {moods.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => onSelect(value)}
            className="flex flex-col items-center gap-1 h-auto py-3 text-xs font-mono"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
      <button
        onClick={onSkip}
        className="text-[10px] font-mono text-muted-foreground/60 underline w-full text-center"
      >
        Skip
      </button>
    </div>
  );
}
