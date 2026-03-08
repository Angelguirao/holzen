import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';

const outcomes = [
  { value: 'held', label: 'Hold' },
  { value: 'sold', label: 'Sell' },
  { value: 'bought', label: 'Buy' },
  { value: 'nothing', label: 'Nothing' },
] as const;

export function RitualDecide({ onComplete }: { onComplete: (decision: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Target className="h-6 w-6 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground text-center">
        You've paused. You've reflected. Now decide intentionally.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {outcomes.map((o) => (
          <Button
            key={o.value}
            variant="outline"
            size="sm"
            onClick={() => { hapticFeedback('medium'); onComplete(o.value); }}
            className="font-mono text-xs"
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
