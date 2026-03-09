import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';

const MOODS = ['fomo', 'excited', 'greedy', 'anxious', 'calm', 'detached', 'uncertain', 'fearful'] as const;
const EMOJI: Record<string, string> = {
  fomo: '😰', excited: '🤩', greedy: '🤑', anxious: '😟',
  calm: '😌', detached: '😐', uncertain: '🤔', fearful: '😨',
};

export function RitualCheckIn({ onComplete }: { onComplete: (mood?: string) => void }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <Heart className="h-5 w-5 text-muted-foreground/40" />
      <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
        {t('practice.howAreYou')}
      </p>
      <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
        {MOODS.map((m) => (
          <button
            key={m}
            onClick={() => { setSelected(m); hapticFeedback('light'); }}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-md border transition-all ${
              selected === m ? 'border-primary/40 bg-primary/5' : 'border-border/30 hover:border-border/60'
            }`}
          >
            <span className="text-lg">{EMOJI[m]}</span>
            <span className="text-[8px] font-mono uppercase tracking-wider text-muted-foreground/60">
              {t(`moods.${m}`)}
            </span>
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => { hapticFeedback('light'); onComplete(selected ?? undefined); }}
        className="font-mono text-xs"
      >
        {t('common.continue')}
      </Button>
    </div>
  );
}
