import { useState } from 'react';
import { PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { hapticFeedback } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';

export function RitualJournal({ onComplete }: { onComplete: (text: string) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col gap-4 py-6">
      <div className="flex items-center gap-2 text-muted-foreground/60">
        <PenLine className="h-4 w-4" />
        <p className="text-xs font-mono">{t('ritualJournal.writeItOut')}</p>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('ritualJournal.placeholder')}
        className="min-h-[100px] text-sm resize-none bg-muted/20 border-border/40"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => { hapticFeedback('light'); onComplete(text); }}
        className="font-mono text-xs self-end"
      >
        {t('ritualJournal.doneWriting')}
      </Button>
    </div>
  );
}
