import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';

const outcomes = [
  { value: 'held', key: 'hold' },
  { value: 'sold', key: 'sell' },
  { value: 'bought', key: 'buy' },
  { value: 'nothing', key: 'nothing' },
] as const;

export function RitualDecide({ onComplete }: { onComplete: (decision: string) => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Target className="h-6 w-6 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground text-center">
        {t('ritual.decide.prompt')}
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
            {t(`ritual.decide.${o.key}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
