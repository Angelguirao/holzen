import { Button } from '@/components/ui/button';

const moodGroups = [
  {
    label: 'High energy',
    moods: [
      { value: 'fomo', label: 'FOMO', emoji: '🔥' },
      { value: 'excited', label: 'Excited', emoji: '⚡' },
      { value: 'greedy', label: 'Greedy', emoji: '🤑' },
      { value: 'anxious', label: 'Anxious', emoji: '😰' },
    ],
  },
  {
    label: 'Low energy',
    moods: [
      { value: 'calm', label: 'Calm', emoji: '🧘' },
      { value: 'detached', label: 'Detached', emoji: '😶' },
      { value: 'uncertain', label: 'Uncertain', emoji: '🤔' },
      { value: 'fearful', label: 'Fearful', emoji: '😨' },
    ],
  },
] as const;

const allMoods = [
  ...moodGroups[0].moods,
  ...moodGroups[1].moods,
] as const;

export type MoodValue = (typeof allMoods)[number]['value'];

interface Props {
  onSelect: (mood: MoodValue) => void;
  onSkip: () => void;
}

export function MoodCheck({ onSelect, onSkip }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-mono text-muted-foreground">How are you feeling right now?</p>
      {moodGroups.map((group) => (
        <div key={group.label} className="space-y-1.5">
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
            {group.label}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {group.moods.map(({ value, label, emoji }) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => onSelect(value)}
                className="flex flex-col items-center gap-0.5 h-auto py-2.5 text-[10px] font-mono border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <span className="text-sm">{emoji}</span>
                {label}
              </Button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={onSkip}
        className="text-[10px] font-mono text-muted-foreground/60 underline w-full text-center"
      >
        Skip
      </button>
    </div>
  );
}
