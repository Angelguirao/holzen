import { useHolzen } from '@/hooks/use-holzen';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';

export function MyWhyWidget() {
  const { motivations, mantra } = useHolzen();
  const { t } = useTranslation();

  if (!mantra && motivations.length === 0) return null;

  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-4 py-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Heart className="h-2.5 w-2.5 text-primary/40" />
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
          {t('myWhy.title')}
        </p>
      </div>
      {mantra && (
        <p className="text-xs font-mono text-foreground/60 italic leading-relaxed">
          "{mantra}"
        </p>
      )}
      {motivations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {motivations.map((m) => (
            <span
              key={m}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/5 text-primary/60 border border-primary/10"
            >
              {t(`settings.motivations.${m}`, m)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
