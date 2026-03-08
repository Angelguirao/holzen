import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';

export function RitualReflect({ message, onComplete }: { message?: string; onComplete: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Eye className="h-6 w-6 text-muted-foreground/40" />
      {message ? (
        <p className="text-sm leading-relaxed text-center max-w-sm">{message}</p>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed text-center max-w-sm italic">
          {t('ritual.reflect.prompt')}
        </p>
      )}
      <Button variant="outline" size="sm" onClick={() => { hapticFeedback('light'); onComplete(); }} className="font-mono text-xs">
        {t('ritual.reflect.iveReflected')}
      </Button>
    </div>
  );
}
